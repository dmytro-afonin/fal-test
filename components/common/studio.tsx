"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BeforeAfterSlider } from "./before-after-slider";
import { PipelineExecutorCompact } from "./pipeline-executor-compact";

interface Preset {
  id: string;
  name: string;
  description: string | null;
  image_before: string | null;
  image_after: string | null;
  credit_cost: number;
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  image_before: string | null;
  image_after: string | null;
  credit_cost: number;
  action_count: number;
  first_preset_id: string | null;
}

interface GalleryItem {
  id: string;
  inputImage: string | null;
  outputImage: string | null;
  presetName: string;
  presetDescription: string;
  createdAt: string;
}

interface StudioProps {
  presets: Preset[];
  pipelines: Pipeline[];
  galleryItems: GalleryItem[];
}

export function Studio({ presets, pipelines, galleryItems }: StudioProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTool, setActiveTool] = useState<{
    type: "preset" | "pipeline";
    id: string;
    name: string;
    description: string;
    before_image_url: string;
    after_image_url: string;
    credit_cost: number;
  } | null>(null);

  const tools = [
    ...presets.map((p) => ({
      type: "preset" as const,
      id: p.id,
      name: p.name,
      description: p.description || "",
      image_before: p.image_before || "",
      image_after: p.image_after || "",
      credit_cost: p.credit_cost,
    })),
    ...pipelines.map((p) => ({
      type: "pipeline" as const,
      id: p.first_preset_id || p.id,
      name: p.name,
      description: p.description || "Custom pipeline",
      image_before: p.image_before || "",
      image_after: p.image_after || "",
      credit_cost: p.credit_cost,
      pipelineId: p.id,
    })),
  ];

  const handleToolSelect = (tool: (typeof tools)[0]) => {
    setActiveTool({
      type: tool.type,
      id: tool.id,
      name: tool.name,
      description: tool.description,
      before_image_url: tool.image_before,
      after_image_url: tool.image_after,
      credit_cost: tool.credit_cost,
    });
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Expandable Sidebar */}
      <div
        className={cn(
          "border-r bg-background transition-all duration-300 flex flex-col",
          sidebarExpanded ? "w-64" : "w-16",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarExpanded && <h2 className="text-lg font-semibold">Tools</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="ml-auto"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {tools.map((tool) => (
              <button
                key={`${tool.type}-${tool.id}`}
                type="button"
                onClick={() => handleToolSelect(tool)}
                className={cn(
                  "w-full text-left p-2 rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeTool?.id === tool.id &&
                    activeTool?.type === tool.type &&
                    "bg-accent text-accent-foreground",
                  !sidebarExpanded && "flex justify-center",
                )}
                title={sidebarExpanded ? undefined : tool.name}
              >
                {sidebarExpanded ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {tool.image_before ? (
                        <Image
                          src={tool.image_before}
                          alt={tool.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {tool.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {tool.credit_cost} credits
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded bg-muted overflow-hidden">
                    {tool.image_before ? (
                      <Image
                        src={tool.image_before}
                        alt={tool.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Gallery Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Studio</h1>
            <p className="text-muted-foreground">
              Select a tool from the sidebar to start creating
            </p>
          </div>

          {galleryItems.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-semibold mb-2">No generations yet</h2>
              <p className="text-muted-foreground">
                Start creating images to see them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden transition-all hover:shadow-lg"
                >
                  <CardContent className="p-0">
                    {item.inputImage && item.outputImage ? (
                      <BeforeAfterSlider
                        beforeImage={item.inputImage}
                        afterImage={item.outputImage}
                        alt={item.presetName}
                      />
                    ) : item.outputImage ? (
                      <div className="relative w-full aspect-square bg-muted">
                        <Image
                          src={item.outputImage}
                          alt={item.presetName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          No image available
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{item.presetName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active Tool at Bottom */}
        {activeTool && (
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">
                    {activeTool.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeTool.credit_cost} credits
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveTool(null)}
                  aria-label="Close tool"
                >
                  ×
                </Button>
              </div>
              <div className="mt-3">
                <PipelineExecutorCompact pipeline={activeTool} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
