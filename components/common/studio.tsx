"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { FloatingToolPanel } from "./floating-tool-panel";

// Helper to format date as "Today", "Yesterday", or "Jan 5"
function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (itemDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (itemDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Helper to format time as "2:30 PM"
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper to get date key for grouping
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

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
  const [showOriginal, setShowOriginal] = useState(false);
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

  const handleDownload = useCallback(async (url: string, filename: string) => {
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
  }, []);

  // Group gallery items by date
  const groupedGalleryItems = useMemo(() => {
    const filtered = galleryItems.filter(
      (item): item is GalleryItem & { outputImage: string } =>
        item.outputImage !== null,
    );

    const groups: {
      dateLabel: string;
      dateKey: string;
      items: typeof filtered;
    }[] = [];
    let currentGroup: (typeof groups)[0] | null = null;

    for (const item of filtered) {
      const date = new Date(item.createdAt);
      const dateKey = getDateKey(date);

      if (!currentGroup || currentGroup.dateKey !== dateKey) {
        currentGroup = {
          dateLabel: formatDateLabel(date),
          dateKey,
          items: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }

    return groups;
  }, [galleryItems]);

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar - part of layout, styled as floating panel */}
      <div className="flex-shrink-0 p-3">
        <div
          className={cn(
            "h-full bg-card border border-border/50 rounded-2xl shadow-xl flex flex-col transition-all duration-300 ease-out",
            sidebarExpanded ? "w-52" : "w-14",
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3">
            {sidebarExpanded && (
              <span className="text-sm font-semibold animate-in fade-in-0 slide-in-from-left-2 duration-200">
                Tools
              </span>
            )}
            <button
              type="button"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={cn(
                "p-1.5 rounded-lg hover:bg-accent transition-colors",
                !sidebarExpanded && "mx-auto",
              )}
              title={sidebarExpanded ? "Collapse" : "Expand"}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {tools.map((tool) => (
              <button
                key={`${tool.type}-${tool.id}`}
                type="button"
                onClick={() => handleToolSelect(tool)}
                className={cn(
                  "w-full text-left p-2 rounded-xl transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeTool?.id === tool.id &&
                    activeTool?.type === tool.type &&
                    "bg-primary/10 text-primary ring-1 ring-primary/20",
                  !sidebarExpanded && "flex justify-center p-2",
                )}
                title={sidebarExpanded ? undefined : tool.name}
              >
                {sidebarExpanded ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {tool.image_before ? (
                        <Image
                          src={tool.image_before}
                          alt={tool.name}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {tool.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.credit_cost} credits
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden">
                    {tool.image_before ? (
                      <Image
                        src={tool.image_before}
                        alt={tool.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 pl-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 mb-3 px-4 py-2.5 bg-card border border-border/50 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <label
              htmlFor="show-original"
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <Checkbox
                id="show-original"
                checked={showOriginal}
                onCheckedChange={(checked) => setShowOriginal(checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Eye className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Show original
              </span>
            </label>
            <div className="text-xs text-muted-foreground">
              {galleryItems.filter((item) => item.outputImage !== null).length}{" "}
              generations
            </div>
          </div>
        </div>

        {/* Scrollable Gallery Area */}
        <div className="flex-1 overflow-y-auto px-1 pb-24">
          {groupedGalleryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 animate-pulse">
                <Sparkles className="w-10 h-10 text-primary/60" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No generations yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a tool from the panel and upload an image to start
                creating
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedGalleryItems.map((group) => (
                <div key={group.dateKey}>
                  {/* Date Separator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {group.dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>

                  {/* Items for this date */}
                  <div className="flex flex-wrap gap-4">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative animate-in fade-in-0 zoom-in-95 duration-300",
                          !showOriginal &&
                            "rounded-2xl overflow-hidden bg-muted",
                        )}
                      >
                        {/* Grouped Images Container */}
                        {showOriginal && item.inputImage ? (
                          <div className="flex flex-col gap-2">
                            {/* Merged Image Pair Box */}
                            <div className="flex items-center rounded-xl overflow-hidden bg-muted">
                              {/* Input Image with hover actions */}
                              <div className="group/input relative flex-shrink-0">
                                <Image
                                  src={item.inputImage}
                                  alt="Original"
                                  width={140}
                                  height={140}
                                  className="w-auto h-auto block"
                                  style={{
                                    maxWidth: "min(16vw, 140px)",
                                    maxHeight: "min(20vh, 180px)",
                                    minWidth: "100px",
                                  }}
                                  unoptimized
                                />
                                {/* Hover actions for input */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/input:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <a
                                    href={item.inputImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Open original"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.inputImage) {
                                        handleDownload(
                                          item.inputImage,
                                          `${item.presetName}-${item.id}-input.png`,
                                        );
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Download original"
                                  >
                                    <Download className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                              </div>

                              {/* Divider line */}
                              <div className="w-px self-stretch bg-border/50" />

                              {/* Output Image with hover actions */}
                              <div className="group/output relative flex-shrink-0">
                                <Image
                                  src={item.outputImage}
                                  alt={item.presetName}
                                  width={140}
                                  height={140}
                                  className="w-auto h-auto block"
                                  style={{
                                    maxWidth: "min(16vw, 140px)",
                                    maxHeight: "min(20vh, 180px)",
                                    minWidth: "100px",
                                  }}
                                  unoptimized
                                />
                                {/* Hover actions for output */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/output:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <a
                                    href={item.outputImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Open result"
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
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Download result"
                                  >
                                    <Download className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bottom info bar for grouped view */}
                            <div className="px-1">
                              <p className="text-xs font-medium truncate">
                                {item.presetName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatTime(new Date(item.createdAt))}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Single Output Image View */
                          <div
                            className="group/single relative"
                            style={{
                              maxWidth: "min(33vw, 280px)",
                              minWidth: "100px",
                            }}
                          >
                            <Image
                              src={item.outputImage}
                              alt={item.presetName}
                              width={280}
                              height={280}
                              className="w-full h-auto object-contain"
                              style={{ maxHeight: "min(33vh, 280px)" }}
                              unoptimized
                            />

                            {/* Centered hover actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/single:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <a
                                href={item.outputImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4 text-white" />
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownload(
                                    item.outputImage,
                                    `${item.presetName}-${item.id}.png`,
                                  )
                                }
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4 text-white" />
                              </button>
                            </div>

                            {/* Bottom bar with info only */}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                              <p className="text-white text-xs font-medium truncate">
                                {item.presetName}
                              </p>
                              <p className="text-white/60 text-[10px]">
                                {formatTime(new Date(item.createdAt))}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
