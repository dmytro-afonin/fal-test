"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
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

interface Preset {
  id: string;
  name: string;
}

interface Action {
  name: string;
  presetId: string;
  id?: string;
}

interface EditCustomPipelineFormProps {
  pipelineName: string;
  initialActions: Array<{ id: string; action_name: string; preset_id: string }>;
}

export function EditCustomPipelineForm({
  pipelineName: initialPipelineName,
  initialActions,
}: EditCustomPipelineFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const [formData, setFormData] = useState({
    pipelineName: initialPipelineName,
    actions: initialActions.map((a) => ({
      name: a.action_name,
      presetId: a.preset_id,
      id: a.id,
    })) as Action[],
  });

  useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch("/api/preset");
        const data = await response.json();
        setPresets(data || []);
      } catch (error) {
        console.error("Error fetching presets:", error);
      } finally {
        setLoadingPresets(false);
      }
    }

    fetchPresets();
  }, []);

  const handleAddAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { name: "", presetId: "" }],
    });
  };

  const handleRemoveAction = async (index: number) => {
    const action = formData.actions[index];

    // If it has an ID, delete it from the server
    if (action.id) {
      try {
        await fetch(`/api/pipeline-mappings?id=${action.id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error deleting action:", error);
      }
    }

    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const handleActionChange = (
    index: number,
    field: keyof Action,
    value: string,
  ) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.pipelineName.trim()) {
        throw new Error("Pipeline name is required");
      }

      if (formData.actions.length === 0) {
        throw new Error("At least one action is required");
      }

      // Validate all actions
      for (const action of formData.actions) {
        if (!action.name.trim()) {
          throw new Error("All actions must have a name");
        }
        if (!action.presetId) {
          throw new Error("All actions must have a preset assigned");
        }
      }

      // Update pipeline name if changed (delete old mappings and create new ones)
      if (formData.pipelineName !== initialPipelineName) {
        // Delete all old mappings
        const deletePromises = initialActions.map((action) =>
          fetch(`/api/pipeline-mappings?id=${action.id}`, {
            method: "DELETE",
          }),
        );
        await Promise.all(deletePromises);

        // Create new mappings with new pipeline name
        const createPromises = formData.actions.map((action) =>
          fetch("/api/pipeline-mappings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pipeline_name: formData.pipelineName,
              action_name: action.name,
              preset_id: action.presetId,
            }),
          }),
        );
        const results = await Promise.all(createPromises);
        const errors = results.filter((r) => !r.ok);
        if (errors.length > 0) {
          throw new Error("Failed to update some pipeline mappings");
        }
      } else {
        // Update existing actions or create new ones
        const updatePromises = formData.actions.map(async (action) => {
          if (action.id) {
            // Delete old and create new (simpler than update)
            await fetch(`/api/pipeline-mappings?id=${action.id}`, {
              method: "DELETE",
            });
          }
          // Create new mapping
          return fetch("/api/pipeline-mappings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pipeline_name: formData.pipelineName,
              action_name: action.name,
              preset_id: action.presetId,
            }),
          });
        });

        const results = await Promise.all(updatePromises);
        const errors = results.filter((r) => !r.ok);
        if (errors.length > 0) {
          throw new Error("Failed to update some pipeline mappings");
        }
      }

      router.push("/admin/pipelines");
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
        <CardTitle>Edit Custom Pipeline</CardTitle>
        <CardDescription>
          Update pipeline actions and their preset mappings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="pipelineName">Pipeline Name</Label>
            <Input
              id="pipelineName"
              placeholder="e.g., Cloth Replacement Pipeline"
              value={formData.pipelineName}
              onChange={(e) =>
                setFormData({ ...formData, pipelineName: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Actions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAction}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </div>

            {formData.actions.map((action, index) => (
              <div
                key={action.name}
                className="flex gap-2 items-end p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <Label htmlFor={`action-name-${index}`}>Action Name</Label>
                  <Input
                    id={`action-name-${index}`}
                    placeholder="e.g., extract-outfit"
                    value={action.name}
                    onChange={(e) =>
                      handleActionChange(index, "name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`action-preset-${index}`}>Preset</Label>
                  {loadingPresets ? (
                    <Input disabled placeholder="Loading presets..." />
                  ) : (
                    <select
                      id={`action-preset-${index}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={action.presetId}
                      onChange={(e) =>
                        handleActionChange(index, "presetId", e.target.value)
                      }
                      required
                    >
                      <option value="">Select a preset</option>
                      {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAction(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
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
              onClick={() => router.push("/admin/pipelines")}
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
