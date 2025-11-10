import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { error } = await supabase
      .from("fal_presets")
      .update({
        name: body.name,
        description: body.description,
        model_id: body.model_id,
        input_template: body.input_template,
        credit_cost: body.credit_cost,
        image_before: body.image_before,
        image_after: body.image_after,
        is_public: body.is_public,
      })
      .eq("id", id);

    if (error) {
      console.error("[v0] Error updating preset:", error);
      return NextResponse.json(
        { error: "Failed to update preset" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error updating preset:", error);
    return NextResponse.json(
      { error: "Failed to update preset" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("fal_presets").delete().eq("id", id);

    if (error) {
      console.error("[v0] Error deleting preset:", error);
      return NextResponse.json(
        { error: "Failed to delete preset" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting preset:", error);
    return NextResponse.json(
      { error: "Failed to delete preset" },
      { status: 500 },
    );
  }
}
