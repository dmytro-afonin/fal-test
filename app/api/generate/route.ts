import { ApiError, fal } from "@fal-ai/client";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import probe from "probe-image-size";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/envs";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/lib/envs_public";
import { createClient } from "@/lib/supabase/server";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

// Admin client for atomic credit operations
const supabaseAdmin = createAdminClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

async function getImageDimensions(
  imageUrl: string,
): Promise<{ width: number; height: number; megapixels: number }> {
  const { width, height } = await probe(imageUrl);
  const megapixels = (width * height) / 1_000_000;

  return { width, height, megapixels };
}

export async function POST(request: NextRequest) {
  try {
    const { pipelineId, imageUrl } = await request.json();

    if (!pipelineId || !imageUrl) {
      return NextResponse.json(
        { error: "Pipeline ID and image URL are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 },
      );
    }

    // Fetch preset configuration
    const { data: preset, error: presetError } = await supabase
      .from("fal_presets")
      .select("*")
      .eq("id", pipelineId)
      .single();

    if (presetError || !preset) {
      console.error("[v0] Preset error:", presetError);
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const { megapixels } = await getImageDimensions(imageUrl);
    const baseCost = preset.credit_cost || 10;
    const creditCost = Math.max(
      baseCost,
      Math.ceil(baseCost * Math.ceil(megapixels)),
    );

    console.log(
      "[v0] Credit calculation - Base:",
      baseCost,
      "Megapixels:",
      megapixels,
      "Total cost:",
      creditCost,
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[v0] Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 },
      );
    }

    if (profile.credits < creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: profile.credits,
        },
        { status: 402 },
      );
    }

    const newBalance = profile.credits - creditCost;
    const { error: deductError } = await supabaseAdmin
      .from("user_profiles")
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (deductError) {
      console.error("[v0] Error deducting credits:", deductError);
      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 },
      );
    }

    console.log(
      "[v0] Deducted",
      creditCost,
      "credits from user",
      user.id,
      "New balance:",
      newBalance,
    );

    // Create generation record
    const { data: generation, error: generationError } = await supabase
      .from("fal_generations")
      .insert({
        user_id: user.id,
        model_id: preset.model_id,
        status: "pending",
        input_data: {
          image_urls: [imageUrl],
          ...preset.input_template,
        },
        credit_cost: creditCost,
        preset_id: preset.id,
      })
      .select()
      .single();

    if (generationError) {
      console.error("Generation error:", generationError);

      await supabaseAdmin
        .from("user_profiles")
        .update({
          credits: profile.credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      return NextResponse.json(
        { error: "Failed to create generation record" },
        { status: 500 },
      );
    }

    // Prepare fal.ai input from generation input_data
    const falInput: Record<string, unknown> = generation.input_data as Record<
      string,
      unknown
    >;

    console.log("Calling fal.ai with model:", preset.model_id);
    console.log("Input:", JSON.stringify(falInput, null, 2));

    // Update generation status to processing
    await supabase
      .from("fal_generations")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    let result: { data: { images: { url: string }[] } };
    try {
      result = await fal.subscribe(preset.model_id, {
        input: falInput,
        logs: true,
      });
      console.log("fal.ai result:", JSON.stringify(result, null, 2));
    } catch (falError: unknown) {
      console.error(falError);
      let errorMessage = JSON.stringify(falError);
      if (falError instanceof ApiError) {
        errorMessage = `${falError.status} | ${falError.name} | ${falError.message}`;
      }
      // Update generation with error
      await supabase
        .from("fal_generations")
        .update({
          status: "failed",
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      await supabaseAdmin
        .from("user_profiles")
        .update({
          credits: profile.credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: creditCost,
        balance_after: profile.credits,
        description: `Refund for failed generation - Preset: ${preset.name}`,
        metadata: {
          preset_id: pipelineId,
          generation_id: generation.id,
          error: errorMessage,
        },
      });

      console.log("Refunded", creditCost, "credits to user", user.id);

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Extract output image URL
    let outputImageUrl: string | undefined;

    if (result.data.images.length > 0) {
      outputImageUrl = result.data.images[0].url;
    }

    console.log("Extracted output URL:", outputImageUrl);

    if (!outputImageUrl) {
      console.error("No image URL found in result structure");

      // Update generation with error
      await supabase
        .from("fal_generations")
        .update({
          status: "failed",
          error: "No image generated - unexpected response structure",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      await supabaseAdmin
        .from("user_profiles")
        .update({
          credits: profile.credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: creditCost,
        balance_after: profile.credits,
        description: `Refund for failed generation - Pipeline: ${preset.name}`,
        metadata: {
          pipeline_id: pipelineId,
          generation_id: generation.id,
          error: "No image URL in response",
        },
      });

      return NextResponse.json(
        {
          error: "No image generated - unexpected response structure",
          result: result,
        },
        { status: 500 },
      );
    }

    // Update generation with result
    const { error: updateError } = await supabase
      .from("fal_generations")
      .update({
        status: "completed",
        output_data: result.data,
        image_urls: result.data.images.map((img: { url: string }) => img.url),
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    if (updateError) {
      console.error("[v0] Error updating generation:", updateError);
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "generation",
      amount: -creditCost,
      balance_after: newBalance,
      description: `Image generation - Preset: ${preset.name}`,
      metadata: {
        preset_id: pipelineId,
        generation_id: generation.id,
        megapixels: megapixels,
        base_cost: baseCost,
      },
    });

    console.log("Generation successful, transaction recorded");

    return NextResponse.json({
      generationId: generation.id,
      outputImageUrl: outputImageUrl,
      creditsUsed: creditCost,
      creditsRemaining: newBalance,
    });
  } catch (error) {
    console.log("Error generating image (outer catch):", error);

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error,
      },
      { status: 500 },
    );
  }
}
