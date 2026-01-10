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
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <PresetGallery presets={presets} />
      </main>

      {/* Floating Action Button */}
      <Link href="/admin/create" className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
          <Plus className="w-6 h-6" />
          <span className="sr-only">Create Preset</span>
        </Button>
      </Link>
    </div>
  );
}
