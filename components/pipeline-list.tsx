"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BeforeAfterSlider } from "./before-after-slider";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  model_id: string;
  before_image_url: string;
  after_image_url: string;
  created_at: string;
}

interface PipelineListProps {
  pipelines: Pipeline[];
}

export function PipelineList({
  pipelines: initialPipelines,
}: PipelineListProps) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pipeline?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/pipelines/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete pipeline");
      }

      setPipelines(pipelines.filter((p) => p.id !== id));
      router.refresh();
    } catch (error) {
      console.error("[v0] Error deleting pipeline:", error);
      alert("Failed to delete pipeline");
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

  return (
    <div className="grid gap-4">
      {pipelines.map((pipeline) => (
        <Card key={pipeline.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{pipeline.name}</CardTitle>
                <CardDescription className="mt-1">
                  {pipeline.description}
                </CardDescription>
                <p className="text-xs text-muted-foreground mt-2">
                  Model: {pipeline.model_id}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/pipeline/${pipeline.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/edit/${pipeline.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pipeline.id)}
                  disabled={deletingId === pipeline.id}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BeforeAfterSlider
              beforeImage={pipeline.after_image_url || "/placeholder.svg"}
              afterImage={pipeline.after_image_url || "/placeholder.svg"}
              alt={pipeline.name}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
