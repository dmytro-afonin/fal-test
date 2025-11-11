"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
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
import { BeforeAfterSlider } from "./before-after-slider";
import { ImagePlaceholder } from "./image-placeholder";

interface Preset {
  id: string;
  name: string;
  description: string;
  model_id: string;
  image_before: string | null;
  image_after: string | null;
  created_at: string;
}

interface PresetGalleryProps {
  presets: Preset[];
}

export function PresetGallery({ presets: initialPresets }: PresetGalleryProps) {
  const [presets, setPresets] = useState(initialPresets);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/preset/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete preset");
      }

      setPresets(presets.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting preset:", error);
      alert("Failed to delete preset");
    } finally {
      setDeletingId(null);
    }
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No presets yet</h2>
        <p className="text-muted-foreground">
          Create your first preset to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {presets.map((preset) => (
        <Card key={preset.id} className="overflow-hidden">
          <CardContent className="p-0">
            {preset.image_before || preset.image_after ? (
              <div className="aspect-video relative">
                <BeforeAfterSlider
                  beforeImage={preset.image_before || undefined}
                  afterImage={preset.image_after || undefined}
                  alt={preset.name}
                />
              </div>
            ) : (
              <div className="aspect-video">
                <ImagePlaceholder
                  className="w-full h-full"
                  label="No preview"
                />
              </div>
            )}
          </CardContent>
          <CardHeader className="p-4">
            <CardTitle className="text-base line-clamp-1">
              {preset.name}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2 mt-1">
              {preset.description}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              {preset.model_id}
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a
                  href={`/pipeline/${preset.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/admin/edit/${preset.id}`}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(preset.id)}
                disabled={deletingId === preset.id}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
