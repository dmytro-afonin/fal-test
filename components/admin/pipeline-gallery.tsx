"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PipelineMapping {
  id: string;
  pipeline_name: string;
  action_name: string;
  preset_id: string;
}

interface Pipeline {
  pipeline_name: string;
  actions: PipelineMapping[];
}

interface PipelineGalleryProps {
  pipelines: Pipeline[];
  presets: Array<{ id: string; name: string }>;
}

export function PipelineGallery({
  pipelines: initialPipelines,
  presets,
}: PipelineGalleryProps) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (pipelineName: string, actionName: string) => {
    if (!confirm("Are you sure you want to delete this pipeline action?"))
      return;

    setDeletingId(`${pipelineName}-${actionName}`);
    try {
      const response = await fetch(
        `/api/pipeline-mappings?pipeline_name=${encodeURIComponent(pipelineName)}&action_name=${encodeURIComponent(actionName)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete pipeline mapping");
      }

      setPipelines(
        pipelines
          .map((p) => ({
            ...p,
            actions: p.actions.filter(
              (a) =>
                !(
                  a.pipeline_name === pipelineName &&
                  a.action_name === actionName
                ),
            ),
          }))
          .filter((p) => p.actions.length > 0),
      );
    } catch (error) {
      console.error("Error deleting pipeline mapping:", error);
      alert("Failed to delete pipeline mapping");
    } finally {
      setDeletingId(null);
    }
  };

  if (pipelines.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No pipelines yet</h2>
        <p className="text-muted-foreground">
          Create your first pipeline to get started
        </p>
      </div>
    );
  }

  const getPresetName = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    return preset?.name || "Unknown Preset";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {pipelines.map((pipeline) => (
        <Card key={pipeline.pipeline_name} className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-base">
              {pipeline.pipeline_name}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {pipeline.actions.length} action
              {pipeline.actions.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {pipeline.actions.map((action) => (
              <div
                key={`${action.pipeline_name}-${action.action_name}`}
                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {action.action_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {getPresetName(action.preset_id)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleDelete(action.pipeline_name, action.action_name)
                  }
                  disabled={
                    deletingId ===
                    `${action.pipeline_name}-${action.action_name}`
                  }
                  className="ml-2 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 mt-3 pt-2 border-t">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link
                  href={`/admin/edit-pipeline/${encodeURIComponent(pipeline.pipeline_name)}`}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit Pipeline
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
