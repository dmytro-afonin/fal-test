"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useUpdateUserCredits, useUser } from "./useUser";

interface ActiveTool {
  id: string;
  name: string;
  credit_cost: number;
}

interface UseImageGenerationOptions {
  activeTool: ActiveTool | null;
}

export function useImageGeneration({ activeTool }: UseImageGenerationOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const { data } = useUser();
  const updateUserCredits = useUpdateUserCredits();
  const isAuthenticated = !!data?.user;
  const userCredits = data?.user?.credits || 0;

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setError(null);
    setEstimatedCost(activeTool?.credit_cost || 0);
  }, [activeTool?.credit_cost]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeTool) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setOutputUrl(null);
        setError(null);

        const img = new window.Image();
        img.onload = () => {
          const megapixels = (img.width * img.height) / 1_000_000;
          const cost = Math.max(
            activeTool.credit_cost,
            Math.ceil(activeTool.credit_cost * Math.ceil(megapixels)),
          );
          setEstimatedCost(cost);
        };
        img.src = url;
      }
    },
    [activeTool],
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || !activeTool) return;

    if (userCredits < estimatedCost) {
      setError(`Need ${estimatedCost} credits, have ${userCredits}`);
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

      const { url: imageUrl } = await uploadResponse.json();

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: activeTool.id,
          imageUrl,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        if (generateResponse.status === 402) {
          throw new Error("Insufficient credits");
        }
        throw new Error(errorData.error || "Failed to generate");
      }

      const { outputImageUrl, creditsRemaining } =
        await generateResponse.json();
      setOutputUrl(outputImageUrl);
      updateUserCredits.mutate(creditsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFile, activeTool, userCredits, estimatedCost, updateUserCredits]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // Refs
    fileInputRef,
    // State
    selectedFile,
    previewUrl,
    outputUrl,
    isGenerating,
    error,
    estimatedCost,
    isAuthenticated,
    userCredits,
    // Actions
    handleFileChange,
    handleGenerate,
    openFilePicker,
    reset,
  };
}

