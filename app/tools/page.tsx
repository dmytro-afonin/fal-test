import Link from "next/link";
import { BeforeAfterSlider } from "@/components/common/before-after-slider";
import { PipelineCard } from "@/components/common/pipeline-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ToolsPage() {
  const supabase = await createClient();

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

  // Fetch pipeline mappings to get preset info for pipelines
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

  // Create a map of preset_id to preset for quick lookup
  const presetMap = new Map(pipelinePresets?.map((p) => [p.id, p]) || []);

  // Group pipeline mappings by pipeline name and get first preset image
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
      };
    }) || [];

  const hasPresets = presets && presets.length > 0;
  const hasPipelines = pipelinesWithImages.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tools</h1>
          <p className="text-muted-foreground">
            Browse available presets and custom pipelines
          </p>
        </div>

        {/* Presets Section */}
        {hasPresets && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Presets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <PipelineCard
                  key={preset.id}
                  id={preset.id}
                  name={preset.name}
                  description={preset.description || ""}
                  beforeImage={preset.image_before || ""}
                  afterImage={preset.image_after || ""}
                  creditCost={preset.credit_cost || 10}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pipelines Section */}
        {hasPipelines && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Custom Pipelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pipelinesWithImages.map((pipeline) => {
                // Get the first preset ID from mappings for this pipeline
                const firstMapping = pipelineMappings?.find(
                  (m) => m.pipeline_name === pipeline.name,
                );
                const firstPresetId = firstMapping?.preset_id;

                return (
                  <Link
                    key={pipeline.id}
                    href={
                      firstPresetId
                        ? `/pipeline/${firstPresetId}`
                        : `/tools/pipeline/${encodeURIComponent(pipeline.name)}`
                    }
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                      <CardContent className="p-0">
                        {pipeline.image_before && pipeline.image_after ? (
                          <BeforeAfterSlider
                            beforeImage={pipeline.image_before}
                            afterImage={pipeline.image_after}
                            alt={pipeline.name}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              No preview
                            </span>
                          </div>
                        )}
                      </CardContent>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {pipeline.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {pipeline.description || "Custom pipeline"}
                        </CardDescription>
                        <div className="text-sm text-muted-foreground mt-2">
                          {pipeline.action_count} action
                          {pipeline.action_count !== 1 ? "s" : ""}
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasPresets && !hasPipelines && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">No tools available</h2>
            <p className="text-muted-foreground mb-6">
              Check back later for available presets and pipelines
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
