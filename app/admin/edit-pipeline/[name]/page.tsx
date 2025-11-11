import { notFound } from "next/navigation";
import { EditCustomPipelineForm } from "@/components/admin/edit-custom-pipeline-form";
import { createClient } from "@/lib/supabase/server";

interface EditPipelinePageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function EditPipelinePage({
  params,
}: EditPipelinePageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const supabase = await createClient();

  const { data: mappings, error } = await supabase
    .from("custom_pipeline_mappings")
    .select("*")
    .eq("pipeline_name", decodedName);

  if (error || !mappings || mappings.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Edit Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Update pipeline actions and preset mappings
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <EditCustomPipelineForm
          pipelineName={decodedName}
          initialActions={mappings}
        />
      </main>
    </div>
  );
}
