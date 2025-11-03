import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPipelineForm } from "@/components/edit-pipeline-form";
import { Button } from "@/components/ui/button";
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

  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !pipeline) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <EditPipelineForm pipeline={pipeline} />
      </main>
    </div>
  );
}
