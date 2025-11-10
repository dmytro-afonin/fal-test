import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      model_id,
      input_template,
      credit_cost,
      image_before,
      image_after,
      is_public,
    } = body;

    if (
      !name ||
      !description ||
      !model_id ||
      !input_template ||
      !image_before ||
      !image_after
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("fal_presets")
      .insert({
        name,
        description,
        model_id,
        input_template,
        credit_cost: credit_cost || 10,
        image_before,
        image_after,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating preset:", error);
      return NextResponse.json(
        { error: "Failed to create preset" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating preset:", error);
    return NextResponse.json(
      { error: "Failed to create preset" },
      { status: 500 },
    );
  }
}
