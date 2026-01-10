"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PipelineGallery } from "@/components/admin/pipeline-gallery";
import { Button } from "@/components/ui/button";

interface Preset {
  id: string;
  name: string;
}

interface PipelineMapping {
  id: string;
  pipeline_name: string;
  action_name: string;
  preset_id: string;
}

export default function AdminPipelinesPage() {
  const [pipelines, setPipelines] = useState<
    Array<{ pipeline_name: string; actions: PipelineMapping[] }>
  >([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch presets
        const presetsRes = await fetch("/api/preset");
        const presetsData = await presetsRes.json();
        setPresets(presetsData || []);

        // Fetch pipeline mappings
        const mappingsRes = await fetch("/api/pipeline-mappings");
        const mappingsData = await mappingsRes.json();

        // Group by pipeline_name
        const grouped = (mappingsData || []).reduce(
          (
            acc: Record<string, PipelineMapping[]>,
            mapping: PipelineMapping,
          ) => {
            if (!acc[mapping.pipeline_name]) {
              acc[mapping.pipeline_name] = [];
            }
            acc[mapping.pipeline_name].push(mapping);
            return acc;
          },
          {},
        );

        // Convert to array format
        const pipelineArray = Object.entries(grouped).map(
          ([pipeline_name, actions]) => ({
            pipeline_name,
            actions: actions as PipelineMapping[],
          }),
        );
        setPipelines(pipelineArray);
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <PipelineGallery
          pipelines={pipelines}
          presets={presets.map((p) => ({ id: p.id, name: p.name }))}
        />
      </main>

      {/* Floating Action Button */}
      <Link
        href="/admin/create-pipeline"
        className="fixed bottom-6 right-6 z-50"
      >
        <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
          <Plus className="w-6 h-6" />
          <span className="sr-only">Create Pipeline</span>
        </Button>
      </Link>
    </div>
  );
}
