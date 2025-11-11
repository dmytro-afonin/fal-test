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
}

export function CreateCustomPipelineForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const [formData, setFormData] = useState({
    pipelineName: "",
    actions: [{ name: "", presetId: "" }] as Action[],
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

  const handleRemoveAction = (index: number) => {
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

      // Create all pipeline mappings
      const promises = formData.actions.map((action) =>
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

      const results = await Promise.all(promises);
      const errors = results.filter((r) => !r.ok);

      if (errors.length > 0) {
        throw new Error("Failed to create some pipeline mappings");
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
        <CardTitle>Create Custom Pipeline</CardTitle>
        <CardDescription>
          Create a custom pipeline by mapping actions to presets
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
                {formData.actions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAction(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Pipeline...
              </>
            ) : (
              "Create Pipeline"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
