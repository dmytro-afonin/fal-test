"use client";

import { useCallback, useEffect, useState } from "react";
import { useUpdateUserCredits, useUser } from "@/hooks/useUser";

interface Tool {
  id: string;
  credit_cost: number;
}

interface UseToolExecutionOptions {
  onSuccess?: (outputUrl: string) => void;
}

export function useToolExecution(tool: Tool, options?: UseToolExecutionOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(tool.credit_cost);

  const { data } = useUser();
  const updateUserCredits = useUpdateUserCredits();

  const isAuthenticated = !!data?.user;
  const userCredits = data?.user?.credits || 0;
  const hasInsufficientCredits = userCredits < estimatedCost;

  // Reset state when tool changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: tool.id is intentionally included to reset when switching tools
  useEffect(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setError(null);
    setEstimatedCost(tool.credit_cost);
  }, [tool.id, tool.credit_cost]);

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setOutputUrl(null);
      setError(null);

      // Calculate cost based on image dimensions
      const img = new Image();
      img.onload = () => {
        const megapixels = (img.width * img.height) / 1_000_000;
        const cost = Math.max(
          tool.credit_cost,
          Math.ceil(tool.credit_cost * Math.ceil(megapixels)),
        );
        setEstimatedCost(cost);
      };
      img.src = url;
    },
    [tool.credit_cost],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setError(null);
  }, []);

  const generate = useCallback(async () => {
    if (!selectedFile) return null;

    if (userCredits < estimatedCost) {
      setError(
        `Insufficient credits. You need ${estimatedCost} credits but only have ${userCredits}.`,
      );
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Upload image
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { url: imageUrl } = await uploadResponse.json();

      // Generate with pipeline
      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pipelineId: tool.id,
          imageUrl,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        if (generateResponse.status === 402) {
          throw new Error(
            `Insufficient credits. Required: ${errorData.required}, Available: ${errorData.available}`,
          );
        }
        throw new Error(errorData.error || "Failed to generate image");
      }

      const { outputImageUrl, creditsRemaining } =
        await generateResponse.json();

      setOutputUrl(outputImageUrl);
      updateUserCredits.mutate(creditsRemaining);
      options?.onSuccess?.(outputImageUrl);

      return outputImageUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedFile,
    userCredits,
    estimatedCost,
    tool.id,
    updateUserCredits,
    options,
  ]);

  return {
    // State
    selectedFile,
    previewUrl,
    outputUrl,
    isGenerating,
    error,
    estimatedCost,

    // User state
    isAuthenticated,
    userCredits,
    hasInsufficientCredits,

    // Actions
    handleFileChange,
    handleFileSelect,
    clearSelection,
    generate,
    setError,
  };
}

