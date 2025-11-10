import Link from "next/link";
import { PipelineCard } from "@/components/pipeline-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: presets } = await supabase
    .from("fal_presets")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4">
      <main className="container mx-auto px-4 py-12">
        {!presets || presets.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">No presets yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first preset in the admin panel
            </p>
            <Link href="/admin">
              <Button>Go to Admin</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map((preset) => (
              <PipelineCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                description={preset.description}
                beforeImage={preset.image_before}
                afterImage={preset.image_after}
                creditCost={preset.credit_cost || 10}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
