"use client";

import { AlertCircle, Coins, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUpdateUserCredits, useUser } from "@/hooks/useUser";

interface PipelineExecutorCompactProps {
  pipeline: {
    id: string;
    name: string;
    description: string;
    before_image_url: string;
    after_image_url: string;
    credit_cost: number;
  };
}

export function PipelineExecutorCompact({
  pipeline,
}: PipelineExecutorCompactProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(pipeline.credit_cost);

  const { data } = useUser();
  const updateUserCredits = useUpdateUserCredits();
  const isAuthenticated = !!data?.user;
  const userCredits = data?.user?.credits || 0;

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOutputUrl(null);
    setError(null);
    setEstimatedCost(pipeline.credit_cost);

    // Estimate cost based on megapixels (matches PipelineExecutor behavior)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const megapixels = (img.width * img.height) / 1_000_000;
      const cost = Math.max(
        pipeline.credit_cost,
        Math.ceil(pipeline.credit_cost * Math.ceil(megapixels)),
      );
      setEstimatedCost(cost);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    if (userCredits < estimatedCost) {
      setError(
        `Insufficient credits. You need ${estimatedCost} credits but only have ${userCredits}.`,
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { url: imageUrl } = (await uploadResponse.json()) as { url: string };

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: pipeline.id,
          imageUrl,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = (await generateResponse.json()) as {
          error?: string;
          required?: number;
          available?: number;
        };
        if (generateResponse.status === 402) {
          throw new Error(
            `Insufficient credits. Required: ${errorData.required}, Available: ${errorData.available}`,
          );
        }
        throw new Error(errorData.error || "Failed to generate image");
      }

      const { outputImageUrl, creditsRemaining } = (await generateResponse.json()) as {
        outputImageUrl: string;
        creditsRemaining: number;
      };

      setOutputUrl(outputImageUrl);
      updateUserCredits.mutate(creditsRemaining);
      router.refresh(); // refresh gallery items
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Log in to run this tool.{" "}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => router.push("/auth/login")}
          >
            Log in
          </Button>{" "}
          or{" "}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => router.push("/auth/sign-up")}
          >
            sign up
          </Button>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <Coins className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Balance: {userCredits} • Cost: {estimatedCost}
          </span>
        </div>
        {outputUrl ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="link" className="h-auto p-0" asChild>
              <a href={outputUrl} target="_blank" rel="noopener noreferrer">
                Open result
              </a>
            </Button>
            <Button variant="link" className="h-auto p-0" asChild>
              <a href={outputUrl} download target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePickFile}
          className="h-12 w-12 rounded-md border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center shrink-0"
          aria-label={selectedFile ? "Replace image" : "Add image"}
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {selectedFile ? selectedFile.name : "Add an input image"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "PNG, JPG, WEBP"}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!selectedFile || isGenerating || userCredits < estimatedCost}
          className="shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running…
            </>
          ) : (
            "Run"
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {userCredits < estimatedCost ? (
        <div className="text-xs text-destructive">
          Insufficient credits ({estimatedCost} needed).{" "}
          <button
            type="button"
            onClick={() => router.push("/credits/top-up")}
            className="underline underline-offset-2"
          >
            Buy more
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : null}
    </div>
  );
}

