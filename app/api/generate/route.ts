import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client";
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

fal.config({
  proxyUrl: "/api/fal/proxy",
});

// Admin client for atomic credit operations
const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number; megapixels: number }> {
  try {
    const response = await fetch(imageUrl)
    const buffer = await response.arrayBuffer()

    // Simple dimension detection - in production you'd use a proper image library
    // For now, we'll use a default assumption of 1024x1024 (1 megapixel)
    const width = 1024
    const height = 1024
    const megapixels = (width * height) / 1_000_000

    return { width, height, megapixels }
  } catch (error) {
    console.error("[v0] Error getting image dimensions:", error)
    // Default to 1 megapixel if we can't determine
    return { width: 1024, height: 1024, megapixels: 1 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pipelineId, imageUrl } = await request.json()

    if (!pipelineId || !imageUrl) {
      return NextResponse.json({ error: "Pipeline ID and image URL are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized - please log in" }, { status: 401 })
    }

    // Fetch pipeline configuration
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select("*")
      .eq("id", pipelineId)
      .single()

    if (pipelineError || !pipeline) {
      console.error("[v0] Pipeline error:", pipelineError)
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    }

    const { megapixels } = await getImageDimensions(imageUrl)
    const baseCost = pipeline.credit_cost || 10
    const creditCost = Math.max(baseCost, Math.ceil(baseCost * megapixels))

    console.log("[v0] Credit calculation - Base:", baseCost, "Megapixels:", megapixels, "Total cost:", creditCost)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    if (profile.credits < creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: profile.credits,
        },
        { status: 402 },
      )
    }

    const newBalance = profile.credits - creditCost
    const { error: deductError } = await supabaseAdmin
      .from("user_profiles")
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (deductError) {
      console.error("[v0] Error deducting credits:", deductError)
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 })
    }

    console.log("[v0] Deducted", creditCost, "credits from user", user.id, "New balance:", newBalance)

    // Create generation record
    const { data: generation, error: generationError } = await supabase
      .from("generations")
      .insert({
        pipeline_id: pipelineId,
        input_image_url: imageUrl,
        user_id: user.id,
        status: "processing",
      })
      .select()
      .single()

    if (generationError) {
      console.error("[v0] Generation error:", generationError)

      await supabaseAdmin
        .from("user_profiles")
        .update({ credits: profile.credits, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      return NextResponse.json({ error: "Failed to create generation record" }, { status: 500 })
    }

    // Prepare fal.ai input
    const falInput: Record<string, unknown> = {
      image_urls: [imageUrl],
      ...(pipeline.config as Record<string, unknown>),
    }

    if (pipeline.prompt) {
      falInput.prompt = pipeline.prompt
    }

    console.log("[v0] Calling fal.ai with model:", pipeline.model_id)
    console.log("[v0] Input:", JSON.stringify(falInput, null, 2))

    let result: any
    try {
      result = await fal.subscribe(pipeline.model_id, {
        input: falInput,
        logs: true,
      });
      console.log("[v0] fal.ai result:", JSON.stringify(result, null, 2))
    } catch (falError: any) {
      console.error("[v0] fal.ai error (full object):", JSON.stringify(falError, null, 2))
      console.error("[v0] fal.ai error message:", falError?.message)
      console.error("[v0] fal.ai error detail:", falError?.detail)
      console.error("[v0] fal.ai error body:", falError?.body)

      // Update generation with error
      await supabase
        .from("generations")
        .update({
          status: "failed",
          error: falError?.message || falError?.detail || JSON.stringify(falError),
        })
        .eq("id", generation.id)

      await supabaseAdmin
        .from("user_profiles")
        .update({ credits: profile.credits, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: creditCost,
        balance_after: profile.credits,
        description: `Refund for failed generation - Pipeline: ${pipeline.name}`,
        metadata: {
          pipeline_id: pipelineId,
          generation_id: generation.id,
          error: falError?.message || "Generation failed",
        },
      })

      console.log("Refunded", creditCost, "credits to user", user.id)

      const errorMessage = falError?.message || falError?.detail || "Failed to generate image with fal.ai"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Extract output image URL
    let outputImageUrl: string | undefined

    if (result.data.images && Array.isArray(result.data.images) && result.data.images.length > 0) {
      outputImageUrl = result.data.images[0].url
    } else if (result.data.image?.url) {
      outputImageUrl = result.image.url
    } else if (result.output?.url) {
      outputImageUrl = result.output.url
    } else if (typeof result.output === "string") {
      outputImageUrl = result.output
    }

    console.log("Extracted output URL:", outputImageUrl)

    if (!outputImageUrl) {
      console.error("No image URL found in result structure")

      // Update generation with error
      await supabase
        .from("generations")
        .update({
          status: "failed",
          error: "No image generated - unexpected response structure",
        })
        .eq("id", generation.id)

      await supabaseAdmin
        .from("user_profiles")
        .update({ credits: profile.credits, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: creditCost,
        balance_after: profile.credits,
        description: `Refund for failed generation - Pipeline: ${pipeline.name}`,
        metadata: {
          pipeline_id: pipelineId,
          generation_id: generation.id,
          error: "No image URL in response",
        },
      })

      return NextResponse.json(
        {
          error: "No image generated - unexpected response structure",
          result: result,
        },
        { status: 500 },
      )
    }

    // Update generation with result
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_image_url: outputImageUrl,
        status: "completed",
      })
      .eq("id", generation.id)

    if (updateError) {
      console.error("[v0] Error updating generation:", updateError)
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "generation",
      amount: -creditCost,
      balance_after: newBalance,
      description: `Image generation - Pipeline: ${pipeline.name}`,
      metadata: {
        pipeline_id: pipelineId,
        generation_id: generation.id,
        megapixels: megapixels,
        base_cost: baseCost,
      },
    })

    console.log("[v0] Generation successful, transaction recorded")

    return NextResponse.json({
      generationId: generation.id,
      outputImageUrl,
      creditsUsed: creditCost,
      creditsRemaining: newBalance,
    })
  } catch (error: any) {
    console.error("[v0] Error generating image (outer catch):", error)
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error keys:", Object.keys(error || {}))
    console.error("[v0] Error stringified:", JSON.stringify(error, null, 2))

    return NextResponse.json(
      {
        error: error?.message || error?.detail || "Failed to generate image",
        details: error,
      },
      { status: 500 },
    )
  }
}
