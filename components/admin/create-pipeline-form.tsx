"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CreatePipelineForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    modelId: "",
    prompt: "",
    config: "{}",
    beforeImageUrl: "",
    afterImageUrl: "",
    creditCost: "10",
    isPublic: false,
  });

  const validateJson = (
    jsonString: string,
  ): { valid: boolean; error?: string } => {
    if (!jsonString.trim()) {
      return { valid: true };
    }
    try {
      JSON.parse(jsonString);
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : "Invalid JSON",
      };
    }
  };

  const formatJson = () => {
    const validation = validateJson(formData.config);
    if (validation.valid && formData.config.trim()) {
      try {
        const parsed = JSON.parse(formData.config);
        setFormData({
          ...formData,
          config: JSON.stringify(parsed, null, 2),
        });
        setJsonError(null);
      } catch {
        // Should not happen since we validated
      }
    }
  };

  const handleConfigChange = (value: string) => {
    setFormData({ ...formData, config: value });
    const validation = validateJson(value);
    if (validation.valid) {
      setJsonError(null);
    } else {
      setJsonError(validation.error || "Invalid JSON");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate JSON config
      const validation = validateJson(formData.config);
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`);
      }

      let configJson = {};
      if (formData.config.trim()) {
        configJson = JSON.parse(formData.config);
      }

      // Build input_template from prompt and config
      const inputTemplate: Record<string, unknown> = {
        ...configJson,
      };
      if (formData.prompt) {
        inputTemplate.prompt = formData.prompt;
      }

      const response = await fetch("/api/preset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          model_id: formData.modelId,
          input_template: inputTemplate,
          image_before: formData.beforeImageUrl,
          image_after: formData.afterImageUrl,
          credit_cost: Number.parseInt(formData.creditCost, 10),
          is_public: formData.isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create pipeline");
      }

      router.push("/admin/presets");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const jsonValidation = validateJson(formData.config);
  const isJsonValid = jsonValidation.valid || !formData.config.trim();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Preset</CardTitle>
        <CardDescription>
          Configure the fal.ai model and example images
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Preset Name</Label>
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
                placeholder="Describe what this preset does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked === true })
                }
              />
              <Label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Make this preset public
              </Label>
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="config">Additional Config (JSON)</Label>
                <div className="flex items-center gap-2">
                  {formData.config.trim() && (
                    <>
                      {isJsonValid ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Valid JSON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          <span>Invalid JSON</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={formatJson}
                        disabled={!isJsonValid}
                        className="h-7 text-xs"
                      >
                        Format JSON
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Textarea
                id="config"
                placeholder='{"num_inference_steps": 4, "image_size": "square_hd"}'
                value={formData.config}
                onChange={(e) => handleConfigChange(e.target.value)}
                className={cn(
                  "font-mono text-sm min-h-[120px]",
                  jsonError
                    ? "border-red-500 focus-visible:ring-red-500"
                    : isJsonValid && formData.config.trim()
                      ? "border-green-500 focus-visible:ring-green-500"
                      : "",
                )}
              />
              {jsonError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {jsonError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Additional parameters for the model (must be valid JSON). Use
                "Format JSON" to auto-format.
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
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isJsonValid}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Preset...
              </>
            ) : (
              "Create Preset"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
