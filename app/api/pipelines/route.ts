import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, model_id, prompt, config, before_image_url, after_image_url } = body

    if (!name || !description || !model_id || !before_image_url || !after_image_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("pipelines")
      .insert({
        name,
        description,
        model_id,
        prompt,
        config,
        before_image_url,
        after_image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating pipeline:", error)
      return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating pipeline:", error)
    return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 })
  }
}
