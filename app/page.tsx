"use client";

import { useState } from "react";
import { generateImageAction } from "./api/fal/actions";
import { fal } from "@fal-ai/client";
import { handleFalError } from "./api/fal/helpers";
import { Skeleton } from "@/components/ui/skeleton";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImageAction = async (imageDataUrl: string, fileName?: string) => {
    try {
      // Convert data URL to File object
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Extract file name and type from the original file or use defaults
      const name = fileName || `image_${Date.now()}.jpg`;
      const type = blob.type || "image/jpeg";
      
      // If we have a fileName, preserve its extension
      let finalName = name;
      if (fileName && fileName.includes('.')) {
        const extension = fileName.split('.').pop();
        finalName = `image_${Date.now()}.${extension}`;
      }
      
      const file = new File([blob], finalName, { type });
      
      // Upload to fal.ai storage
      const url = await fal.storage.upload(file);
      console.log({url});
      
      return {
        success: true,
        imageUrl: url,
      };
    } catch (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: handleFalError(error),
      };
    }
  }
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setGeneratedImage(null);
    }
  };


  const generateImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageDataUrl = e.target?.result as string;
          
          // Step 1: Upload image to storage
          const uploadResult = await uploadImageAction(imageDataUrl, selectedImage.name);
          console.log({uploadResult});
          
          if (!uploadResult.success) {
            setError(uploadResult.error || "Failed to upload image");
            setIsGenerating(false);
            return;
          }

          // Step 2: Generate image using uploaded URL
          const generateResult = await generateImageAction(uploadResult.imageUrl!);

          if (generateResult.success) {
            setGeneratedImage(generateResult.imageUrl ?? null);
          } else {
            setError(generateResult.error || "Failed to generate image");
          }
        } catch (actionError) {
          console.error("Error in generation process:", actionError);
          setError("Server error during generation. Please try again.");
        }
        setIsGenerating(false);
      };
      
      reader.onerror = () => {
        setError("Failed to read the image file. Please try a different image.");
        setIsGenerating(false);
      };
      
      reader.readAsDataURL(selectedImage);
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Error generating image. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Deegva | AI
        </h1>
        
        <div className="rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer block"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Selected image preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload an image
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {selectedImage && (
          <div className="rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Generate Realistic Photo</h2>
            <p className="text-gray-600 mb-4">
              Click the button below to transform your image into a realistic photo.
            </p>
            <button
              onClick={generateImage}
              disabled={isGenerating}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isGenerating ? "Generating..." : "Generate Realistic Photo"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isGenerating && (
          <div className="rounded-lg shadow-lg p-6">
            <div className="space-y-2">
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        )}

        {generatedImage && !isGenerating && (
          <div className="rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Result</h2>
            <div className="text-center">
              <img
                src={generatedImage}
                alt="Generated realistic photo"
                className="max-w-full h-auto rounded-lg mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
