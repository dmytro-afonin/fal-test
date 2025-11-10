import { notFound } from "next/navigation";
import { PipelineExecutor } from "@/components/pipeline-executor";
import { createClient } from "@/lib/supabase/server";

interface PipelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function PipelinePage({ params }: PipelinePageProps) {
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

  // Convert preset to pipeline format for PipelineExecutor component
  const pipeline = {
    id: preset.id,
    name: preset.name,
    description: preset.description || "",
    before_image_url: preset.image_before || "",
    after_image_url: preset.image_after || "",
    credit_cost: preset.credit_cost,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{preset.name}</h1>
          <p className="text-sm text-muted-foreground">{preset.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <PipelineExecutor pipeline={pipeline} />
      </section>
    </div>
  );
}
