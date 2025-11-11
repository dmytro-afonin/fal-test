import { redirect } from "next/navigation";
import { Studio } from "@/components/common/studio";
import { createClient } from "@/lib/supabase/server";

export default async function StudioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch public presets
  const { data: presets } = await supabase
    .from("fal_presets")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  // Fetch all pipelines
  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch pipeline mappings
  const { data: pipelineMappings } = await supabase
    .from("custom_pipeline_mappings")
    .select("pipeline_name, preset_id")
    .order("pipeline_name");

  // Get preset details for pipelines
  const presetIds =
    pipelineMappings?.map((m) => m.preset_id).filter(Boolean) || [];
  const { data: pipelinePresets } =
    presetIds.length > 0
      ? await supabase
          .from("fal_presets")
          .select("id, image_before, image_after, credit_cost")
          .in("id", presetIds)
      : { data: null };

  const presetMap = new Map(pipelinePresets?.map((p) => [p.id, p]) || []);

  const pipelinesWithImages =
    pipelines?.map((pipeline) => {
      const mappings = pipelineMappings?.filter(
        (m) => m.pipeline_name === pipeline.name,
      );
      const firstMapping = mappings?.[0];
      const firstPreset = firstMapping
        ? presetMap.get(firstMapping.preset_id)
        : null;

      return {
        ...pipeline,
        image_before: firstPreset?.image_before || null,
        image_after: firstPreset?.image_after || null,
        credit_cost: firstPreset?.credit_cost || 10,
        action_count: mappings?.length || 0,
        first_preset_id: firstMapping?.preset_id || null,
      };
    }) || [];

  // Fetch user's completed generations for gallery
  const { data: generations } = await supabase
    .from("fal_generations")
    .select(
      `
      id,
      status,
      image_urls,
      input_data,
      preset_id,
      created_at,
      fal_presets (
        id,
        name,
        description
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  const galleryItems =
    generations?.map((gen) => {
      const inputData = gen.input_data as {
        image_urls?: string[];
        [key: string]: unknown;
      };
      const inputImageUrl =
        Array.isArray(inputData?.image_urls) && inputData.image_urls.length > 0
          ? inputData.image_urls[0]
          : null;

      const outputImageUrl =
        Array.isArray(gen.image_urls) && gen.image_urls.length > 0
          ? gen.image_urls[0]
          : null;

      return {
        id: gen.id,
        inputImage: inputImageUrl,
        outputImage: outputImageUrl,
        presetName: (gen.fal_presets as { name?: string })?.name || "Unknown",
        presetDescription:
          (gen.fal_presets as { description?: string })?.description || "",
        createdAt: gen.created_at,
      };
    }) || [];

  return (
    <Studio
      presets={presets || []}
      pipelines={pipelinesWithImages}
      galleryItems={galleryItems}
    />
  );
}
