"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PresetGallery } from "@/components/admin/preset-gallery";
import { Button } from "@/components/ui/button";

interface Preset {
  id: string;
  name: string;
  description: string;
  model_id: string;
  image_before: string | null;
  image_after: string | null;
  created_at: string;
}

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const presetsRes = await fetch("/api/preset");
        const presetsData = await presetsRes.json();
        setPresets(presetsData || []);
      } catch (error) {
        console.error("Error fetching presets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPresets();
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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Presets</h1>
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
        <PresetGallery presets={presets} />
      </main>
    </div>
  );
}
