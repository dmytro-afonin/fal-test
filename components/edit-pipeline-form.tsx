"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  model_id: string;
  prompt: string | null;
  config: Record<string, unknown>;
  before_image_url: string;
  after_image_url: string;
  credit_cost: number;
}

interface EditPipelineFormProps {
  pipeline: Pipeline;
}

export function EditPipelineForm({ pipeline }: EditPipelineFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: pipeline.name,
    description: pipeline.description,
    modelId: pipeline.model_id,
    prompt: pipeline.prompt || "",
    config: JSON.stringify(pipeline.config, null, 2),
    beforeImageUrl: pipeline.before_image_url,
    afterImageUrl: pipeline.after_image_url,
    creditCost: pipeline.credit_cost?.toString() || "10",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate JSON config
      let configJson = {};
      if (formData.config.trim()) {
        try {
          configJson = JSON.parse(formData.config);
        } catch {
          throw new Error("Invalid JSON in config field");
        }
      }

      const response = await fetch(`/api/pipelines/${pipeline.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          model_id: formData.modelId,
          prompt: formData.prompt || null,
          config: configJson,
          before_image_url: formData.beforeImageUrl,
          after_image_url: formData.afterImageUrl,
          credit_cost: Number.parseInt(formData.creditCost, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update pipeline");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Pipeline</CardTitle>
        <CardDescription>Update the pipeline configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Pipeline Name</Label>
              <Input
                id="name"
                placeholder="e.g., Background Removal"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this pipeline does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelId">fal.ai Model ID</Label>
              <Input
                id="modelId"
                placeholder="e.g., fal-ai/flux/schnell"
                value={formData.modelId}
                onChange={(e) =>
                  setFormData({ ...formData, modelId: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find model IDs at{" "}
                <a
                  href="https://fal.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  fal.ai/models
                </a>
              </p>
            </div>

            <div>
              <Label htmlFor="prompt">Prompt (Optional)</Label>
              <Textarea
                id="prompt"
                placeholder="Enter a prompt if the model requires one..."
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="config">Additional Config (JSON)</Label>
              <Textarea
                id="config"
                placeholder='{"num_inference_steps": 4, "image_size": "square_hd"}'
                value={formData.config}
                onChange={(e) =>
                  setFormData({ ...formData, config: e.target.value })
                }
                className="font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Additional parameters for the model (must be valid JSON)
              </p>
            </div>

            <div>
              <Label htmlFor="creditCost">Credit Cost (per megapixel)</Label>
              <Input
                id="creditCost"
                type="number"
                min="1"
                placeholder="10"
                value={formData.creditCost}
                onChange={(e) =>
                  setFormData({ ...formData, creditCost: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Base cost per megapixel. Final cost = base cost × image
                megapixels (minimum: base cost)
              </p>
            </div>
          </div>

          {/* Example Images */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="beforeImageUrl">Before Image URL</Label>
              <Input
                id="beforeImageUrl"
                type="url"
                placeholder="https://example.com/before.jpg"
                value={formData.beforeImageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, beforeImageUrl: e.target.value })
                }
                required
              />
              {formData.beforeImageUrl && (
                <div className="mt-2">
                  <Image
                    fill
                    src={formData.beforeImageUrl || "/placeholder.svg"}
                    alt="Before preview"
                    className="w-full max-w-xs aspect-video object-cover rounded-lg"
                    onError={() => {
                      console.log(
                        "[v0] Failed to load before image preview:",
                        formData.beforeImageUrl,
                      );
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="afterImageUrl">After Image URL</Label>
              <Input
                id="afterImageUrl"
                type="url"
                placeholder="https://example.com/after.jpg"
                value={formData.afterImageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, afterImageUrl: e.target.value })
                }
                required
              />
              {formData.afterImageUrl && (
                <div className="mt-2">
                  <Image
                    fill
                    src={formData.afterImageUrl || "/placeholder.svg"}
                    alt="After preview"
                    className="w-full max-w-xs aspect-video object-cover rounded-lg"
                    onError={() => {
                      console.log(
                        "[v0] Failed to load after image preview:",
                        formData.afterImageUrl,
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Pipeline"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
