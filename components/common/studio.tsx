"use client";

import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FloatingToolPanel } from "./floating-tool-panel";

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

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const handleDownload = useCallback(
    async (url: string, filename: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Fallback: open in new tab if download fails
        window.open(url, "_blank");
      }
    },
    [],
  );

  return (
    <div className="flex overflow-hidden">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Gallery Area */}
        <div className="flex-1 overflow-y-auto p-6">
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
            <div className="flex flex-wrap gap-4">
              {galleryItems
                .filter(
                  (item): item is GalleryItem & { outputImage: string } =>
                    item.outputImage !== null,
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden bg-muted"
                    style={{ maxWidth: "min(33vw, 280px)", minWidth: "100px" }}
                  >
                    {/* Image with constrained size */}
                    <Image
                      src={item.outputImage}
                      alt={item.presetName}
                      width={280}
                      height={280}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: "min(33vh, 280px)" }}
                      unoptimized
                    />

                    {/* Bottom bar with info and actions - always visible */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">
                            {item.presetName}
                          </p>
                          <p className="text-white/60 text-[10px]">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <a
                            href={item.outputImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                item.outputImage,
                                `${item.presetName}-${item.id}.png`,
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Tool Panel */}
      {activeTool && (
        <FloatingToolPanel activeTool={activeTool} onClose={handleCloseTool} />
      )}
    </div>
  );
}
