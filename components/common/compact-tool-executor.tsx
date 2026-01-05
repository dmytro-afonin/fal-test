"use client";

import { AlertCircle, Check, Coins, Loader2, Plus, X } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/hooks/useToolExecution";

interface CompactToolExecutorProps {
  tool: {
    id: string;
    name: string;
    description: string;
    before_image_url: string;
    after_image_url: string;
    credit_cost: number;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function CompactToolExecutor({
  tool,
  onClose,
  onSuccess,
}: CompactToolExecutorProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    previewUrl,
    isGenerating,
    error,
    estimatedCost,
    isAuthenticated,
    hasInsufficientCredits,
    handleFileChange,
    clearSelection,
    generate,
    selectedFile,
  } = useToolExecution(tool, {
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        clearSelection();
        onSuccess?.();
        router.refresh();
      }, 1500);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-background border-t">
        <div className="flex items-center gap-3">
          <span className="font-medium">{tool.name}</span>
          <span className="text-sm text-muted-foreground">
            Please{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="text-primary hover:underline"
            >
              log in
            </button>{" "}
            to use this tool
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-background border-t">
      {/* Upload placeholder / Preview thumbnail */}
      <label className="flex-shrink-0 cursor-pointer group">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isGenerating}
        />
        {previewUrl ? (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-primary">
            <NextImage
              src={previewUrl}
              alt="Selected"
              fill
              className="object-cover"
            />
            {!isGenerating && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  clearSelection();
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/50 group-hover:border-primary group-hover:bg-muted transition-colors">
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
      </label>

      {/* Tool info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{tool.name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {estimatedCost}
          </span>
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {!error && !selectedFile && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Click the + to upload an image
          </p>
        )}
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={!selectedFile || isGenerating || showSuccess || hasInsufficientCredits}
        size="sm"
        className="flex-shrink-0"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Running...
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-4 w-4 mr-1.5" />
            Done!
          </>
        ) : (
          "Run"
        )}
      </Button>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="flex-shrink-0"
        disabled={isGenerating}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

