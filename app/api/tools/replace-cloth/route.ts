import { ApiError, fal } from "@fal-ai/client";
import type { QwenImageEditPlusLoraInput } from "@fal-ai/client/endpoints";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/envs";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/lib/envs_public";
import { createClient } from "@/lib/supabase/server";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

// UUID for cloth-replacement pipeline
const CLOTH_REPLACEMENT_PIPELINE_ID = "550e8400-e29b-41d4-a716-446655440000";

// Admin client for atomic credit operations
const supabaseAdmin = createAdminClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 },
      );
    }

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

    const { characterImageUrl, clothesImageUrl } = await request.json();
    //todo calculate credit cost

    const creditCost = 80;
    const pipelineId = crypto.randomUUID();

    const newBalance = profile.credits - creditCost;
    if (newBalance < 0) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: profile.credits,
        },
        { status: 402 },
      );
    }

    await supabaseAdmin
      .from("user_profiles")
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    console.log(
      "Deducted",
      creditCost,
      "credits from user",
      user.id,
      "New balance:",
      newBalance,
    );

    // Create generation record for step 1
    const { data: generation, error: generationError } = await supabase
      .from("fal_generations")
      .insert({
        user_id: user.id,
        model_id: "fal-ai/qwen-image-edit-plus-lora",
        status: "pending",
        input_data: {
          image_urls: [clothesImageUrl],
          prompt: "extract the outfit onto a white background",
          negative_prompt:
            "blurry, low quality, low resolution, bad anatomy, deformed, distorted, extra limbs, missing limbs, extra fingers, fused fingers, text, watermark, logo, artifacts, overexposed, underexposed, grainy",
          loras: [
            {
              path: "https://huggingface.co/WILDFAL/extr_outfeet/resolve/main/extract-outfit_v3.safetensors?download=true",
              scale: 1.0,
            },
          ],
        },
        credit_cost: creditCost / 2,
        pipeline_type: "cloth-replacement",
        pipeline_id: pipelineId,
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

    const falInput: QwenImageEditPlusLoraInput =
      generation.input_data as QwenImageEditPlusLoraInput;

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
      result = await fal.subscribe("fal-ai/qwen-image-edit-plus-lora", {
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
        description: `Refund for failed generation - Pipeline: ${CLOTH_REPLACEMENT_PIPELINE_ID}`,
        metadata: {
          pipeline_id: CLOTH_REPLACEMENT_PIPELINE_ID,
          generation_id: generation.id,
          error: errorMessage,
        },
      });

      console.log("Refunded", creditCost, "credits to user", user.id);

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Extract output image URL from step 1
    let outputImageUrl: string | undefined;

    if (result.data.images.length > 0) {
      outputImageUrl = result.data.images[0].url;
    }

    console.log("Extracted output URL:", outputImageUrl);

    // Update step 1 generation with result
    await supabase
      .from("fal_generations")
      .update({
        status: "completed",
        output_data: result.data,
        image_urls: result.data.images.map((img: { url: string }) => img.url),
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

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
        description: `Refund for failed generation - Pipeline: ${CLOTH_REPLACEMENT_PIPELINE_ID}`,
        metadata: {
          pipeline_id: CLOTH_REPLACEMENT_PIPELINE_ID,
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

    // phase 2 - generate character image with the outfit
    // Create generation record for step 2
    const { data: generation2, error: generation2Error } = await supabase
      .from("fal_generations")
      .insert({
        user_id: user.id,
        model_id: "fal-ai/qwen-image-edit-plus-lora",
        status: "pending",
        input_data: {
          image_urls: [characterImageUrl, outputImageUrl],
          prompt: "change wearing clothes to clothes from second image",
          negative_prompt:
            "blurry, low quality, low resolution, bad anatomy, deformed, distorted, extra limbs, missing limbs, extra fingers, fused fingers, text, watermark, logo, artifacts, overexposed, underexposed, grainy",
          loras: [
            {
              path: "https://huggingface.co/WILDFAL/odevalka/resolve/main/Try_On_Qwen_Edit_Lora.safetensors?download=true",
              scale: 1.0,
            },
          ],
        },
        credit_cost: creditCost / 2,
        pipeline_type: "cloth-replacement",
        pipeline_id: pipelineId,
      })
      .select()
      .single();

    if (generation2Error) {
      console.error("Generation step 2 error:", generation2Error);
      // Refund already deducted credits
      await supabaseAdmin
        .from("user_profiles")
        .update({
          credits: profile.credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      return NextResponse.json(
        { error: "Failed to create step 2 generation record" },
        { status: 500 },
      );
    }

    const falInput2: QwenImageEditPlusLoraInput =
      generation2.input_data as QwenImageEditPlusLoraInput;

    console.log("Step 2 Input:", JSON.stringify(falInput2, null, 2));

    // Update generation status to processing
    await supabase
      .from("fal_generations")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", generation2.id);

    let result2: { data: { images: { url: string }[] } };
    try {
      result2 = await fal.subscribe("fal-ai/qwen-image-edit-plus-lora", {
        input: falInput2,
        logs: true,
      });
      console.log("fal.ai result step 2:", JSON.stringify(result2, null, 2));
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
        .eq("id", generation2.id);

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
        description: `Refund for failed generation - Pipeline: ${CLOTH_REPLACEMENT_PIPELINE_ID}`,
        metadata: {
          pipeline_id: CLOTH_REPLACEMENT_PIPELINE_ID,
          generation_id: generation.id,
          error: errorMessage,
        },
      });

      console.log("Refunded", creditCost, "credits to user", user.id);

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Extract output image URL from step 2
    let outputImageUrl2: string | undefined;
    if (result2.data.images.length > 0) {
      outputImageUrl2 = result2.data.images[0].url;
    }

    console.log("Extracted output URL step 2:", outputImageUrl2);

    if (!outputImageUrl2) {
      console.error("No image URL found in result structure");

      // Update generation with error
      await supabase
        .from("fal_generations")
        .update({
          status: "failed",
          error: "No image generated - unexpected response structure",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation2.id);

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
        description: `Refund for failed generation - Pipeline: ${CLOTH_REPLACEMENT_PIPELINE_ID}`,
        metadata: {
          pipeline_id: CLOTH_REPLACEMENT_PIPELINE_ID,
          generation_id: generation.id,
          error: "No image URL in response",
        },
      });

      return NextResponse.json(
        {
          error: "No image generated - unexpected response structure",
          result: result2,
        },
        { status: 500 },
      );
    }

    // Update step 2 generation with final result
    const { error: updateError } = await supabase
      .from("fal_generations")
      .update({
        status: "completed",
        output_data: result2.data,
        image_urls: result2.data.images.map((img: { url: string }) => img.url),
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation2.id);

    if (updateError) {
      console.error("[v0] Error updating generation step 2:", updateError);
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "generation",
      amount: -creditCost,
      balance_after: newBalance,
      description: `Image generation - Pipeline: ${CLOTH_REPLACEMENT_PIPELINE_ID}`,
      metadata: {
        pipeline_id: CLOTH_REPLACEMENT_PIPELINE_ID,
        generation_id: generation.id,
        megapixels: 0,
        base_cost: creditCost,
      },
    });

    console.log("Generation successful, transaction recorded");

    return NextResponse.json({
      generationId: generation2.id,
      outputImageUrl: outputImageUrl2,
      creditsUsed: creditCost,
      creditsRemaining: newBalance,
    });
  } catch (error) {
    console.log("Error generating image (outer catch):", error);

    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
