import { notFound } from "next/navigation";
import { EditPipelineForm } from "@/components/edit-pipeline-form";
import { createClient } from "@/lib/supabase/server";

interface EditPipelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPipelinePage({
  params,
}: EditPipelinePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: preset, error } = await supabase
    .from("fal_presets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !preset) {
    notFound();
  }

  // Convert preset to pipeline format for EditPipelineForm component
  const inputTemplate = preset.input_template as Record<string, unknown>;
  const { prompt, ...config } = inputTemplate;

  const pipeline = {
    id: preset.id,
    name: preset.name,
    description: preset.description || "",
    model_id: preset.model_id,
    prompt: (prompt as string) || null,
    config: config || {},
    before_image_url: preset.image_before || "",
    after_image_url: preset.image_after || "",
    credit_cost: preset.credit_cost,
    is_public: preset.is_public || false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Edit Preset</h1>
          <p className="text-sm text-muted-foreground">
            Update preset configuration
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <EditPipelineForm pipeline={pipeline} />
      </main>
    </div>
  );
}
