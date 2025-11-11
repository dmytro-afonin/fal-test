import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all pipeline mappings for a pipeline
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineName = searchParams.get("pipeline_name");

    const supabase = await createClient();

    let query = supabase.from("custom_pipeline_mappings").select("*");

    if (pipelineName) {
      query = query.eq("pipeline_name", pipelineName);
    }

    const { data, error } = await query.order("pipeline_name");

    if (error) {
      console.error("Error fetching pipeline mappings:", error);
      return NextResponse.json(
        { error: "Failed to fetch pipeline mappings" },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching pipeline mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline mappings" },
      { status: 500 },
    );
  }
}

// POST create pipeline mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipeline_name, action_name, preset_id } = body;

    if (!pipeline_name || !action_name || !preset_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: pipeline_name, action_name, preset_id",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("custom_pipeline_mappings")
      .insert({
        pipeline_name,
        action_name,
        preset_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating pipeline mapping:", error);
      return NextResponse.json(
        { error: "Failed to create pipeline mapping" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating pipeline mapping:", error);
    return NextResponse.json(
      { error: "Failed to create pipeline mapping" },
      { status: 500 },
    );
  }
}

// DELETE pipeline mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const pipelineName = searchParams.get("pipeline_name");
    const actionName = searchParams.get("action_name");

    if (!id && (!pipelineName || !actionName)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    let query = supabase.from("custom_pipeline_mappings").delete();

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query
        .eq("pipeline_name", pipelineName)
        .eq("action_name", actionName);
    }

    const { error } = await query;

    if (error) {
      console.error("Error deleting pipeline mapping:", error);
      return NextResponse.json(
        { error: "Failed to delete pipeline mapping" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pipeline mapping:", error);
    return NextResponse.json(
      { error: "Failed to delete pipeline mapping" },
      { status: 500 },
    );
  }
}
