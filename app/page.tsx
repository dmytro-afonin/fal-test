import Link from "next/link";
import { PipelineCard } from "@/components/pipeline-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4">
      <main className="container mx-auto px-4 py-12">
        {!pipelines || pipelines.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">No pipelines yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first pipeline in the admin panel
            </p>
            <Link href="/admin">
              <Button>Go to Admin</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <PipelineCard
                key={pipeline.id}
                id={pipeline.id}
                name={pipeline.name}
                description={pipeline.description}
                beforeImage={pipeline.before_image_url}
                afterImage={pipeline.after_image_url}
                creditCost={pipeline.credit_cost || 10}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
