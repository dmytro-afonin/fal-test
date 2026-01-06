"use client";

import { Coins, Download, Loader2, Plus, X } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { cn } from "@/lib/utils";

interface ActiveTool {
  id: string;
  name: string;
  description: string;
  credit_cost: number;
}

interface FloatingToolPanelProps {
  activeTool: ActiveTool;
  onClose: () => void;
}

export function FloatingToolPanel({
  activeTool,
  onClose,
}: FloatingToolPanelProps) {
  const router = useRouter();

  const {
    fileInputRef,
    previewUrl,
    outputUrl,
    isGenerating,
    error,
    estimatedCost,
    isAuthenticated,
    userCredits,
    selectedFile,
    handleFileChange,
    handleGenerate,
    openFilePicker,
  } = useImageGeneration({ activeTool });

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
      window.open(url, "_blank");
    }
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-md border shadow-2xl rounded-2xl px-5 py-4 min-w-[320px] max-w-[480px]">
        {/* Header with description */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              {activeTool.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {activeTool.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Image upload box */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={openFilePicker}
            className={cn(
              "relative w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-all overflow-hidden flex-shrink-0",
              "hover:border-primary hover:bg-accent/50",
              previewUrl
                ? "border-primary bg-accent/30"
                : "border-muted-foreground/30",
            )}
          >
            {previewUrl ? (
              <NextImage
                src={previewUrl}
                alt="Selected"
                fill
                className="object-cover"
              />
            ) : (
              <Plus className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {/* Result preview (if available) */}
          {outputUrl && (
            <div className="relative w-14 h-14 rounded-xl border-2 border-green-500/50 overflow-hidden flex-shrink-0">
              <NextImage
                src={outputUrl}
                alt="Result"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Generate button */}
          <div className="flex-1 flex flex-col gap-1">
            {!isAuthenticated ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Login to generate
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={
                  !selectedFile || isGenerating || userCredits < estimatedCost
                }
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-3 h-3 mr-1.5" />
                    Run · {estimatedCost || activeTool.credit_cost}
                  </>
                )}
              </Button>
            )}
            {error && (
              <p className="text-xs text-destructive truncate">{error}</p>
            )}
          </div>

          {/* Download button for result */}
          {outputUrl && (
            <button
              type="button"
              onClick={() =>
                handleDownload(outputUrl, `${activeTool.name}-result.png`)
              }
              className="p-1.5 rounded-md hover:bg-accent transition-colors flex-shrink-0"
              title="Download result"
            >
              <Download className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
