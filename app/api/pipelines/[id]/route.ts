import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { error } = await supabase
      .from("pipelines")
      .update({
        name: body.name,
        description: body.description,
        model_id: body.model_id,
        prompt: body.prompt,
        config: body.config,
        before_image_url: body.before_image_url,
        after_image_url: body.after_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating pipeline:", error)
      return NextResponse.json({ error: "Failed to update pipeline" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating pipeline:", error)
    return NextResponse.json({ error: "Failed to update pipeline" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from("pipelines").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting pipeline:", error)
      return NextResponse.json({ error: "Failed to delete pipeline" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting pipeline:", error)
    return NextResponse.json({ error: "Failed to delete pipeline" }, { status: 500 })
  }
}
