import { Plus } from "lucide-react";
import Link from "next/link";
import { PipelineList } from "@/components/pipeline-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: presets, error } = await supabase
    .from("fal_presets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[v0] Error fetching presets:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage AI presets</p>
            </div>
            <Link href="/admin/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Preset
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <PipelineList pipelines={presets || []} />
      </main>
    </div>
  );
}
