"use client";

import { AlertCircle, Coins, Loader2, Upload } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateUserCredits, useUser } from "@/hooks/useUser";
import { BeforeAfterSlider } from "./before-after-slider";

export function CloseReplacement() {
  const CREDIT_COST = 80;
  const router = useRouter();
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [clothFile, setClothFile] = useState<File | null>(null);

  const [characterPreviewUrl, setCharacterPreviewUrl] = useState<string | null>(
    null,
  );
  const [clothPreviewUrl, setClothPreviewUrl] = useState<string | null>(null);

  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data } = useUser();
  const updateUserCredits = useUpdateUserCredits();
  const isAuthenticated = !!data?.user;
  const userCredits = data?.user?.credits || 0;
  const [characterCost, setCharacterCost] = useState(0);
  const [clothCost, setClothCost] = useState(0);
  const estimatedCost =
    characterCost + clothCost > 0 ? characterCost + clothCost : CREDIT_COST;

  const calculateImageCost = (width: number, height: number): number => {
    const megapixels = (width * height) / 1_000_000;
    return Math.max(
      CREDIT_COST,
      Math.ceil(CREDIT_COST * Math.ceil(megapixels)),
    );
  };

  const handleCharacterFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setCharacterFile(file);
      const url = URL.createObjectURL(file);
      setCharacterPreviewUrl(url);
      setOutputUrl(null);
      setError(null);

      const img = new Image();
      img.onload = () => {
        const cost = calculateImageCost(img.width, img.height);
        setCharacterCost(cost);
      };
      img.src = url;
    }
  };

  const handleClothFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClothFile(file);
      const url = URL.createObjectURL(file);
      setClothPreviewUrl(url);
      setOutputUrl(null);
      setError(null);

      const img = new Image();
      img.onload = () => {
        const cost = calculateImageCost(img.width, img.height);
        setClothCost(cost);
      };
      img.src = url;
    }
  };

  const handleGenerate = async () => {
    if (!characterFile || !clothFile) {
      setError("Please upload both character and cloth images");
      return;
    }

    if (userCredits < estimatedCost) {
      setError(
        `Insufficient credits. You need ${estimatedCost} credits but only have ${userCredits}.`,
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Upload character image
      const characterFormData = new FormData();
      characterFormData.append("file", characterFile);

      const characterUploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: characterFormData,
      });

      if (!characterUploadResponse.ok) {
        throw new Error("Failed to upload character image");
      }

      const { url: characterImageUrl } = await characterUploadResponse.json();

      // Upload cloth image
      const clothFormData = new FormData();
      clothFormData.append("file", clothFile);

      const clothUploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: clothFormData,
      });

      if (!clothUploadResponse.ok) {
        throw new Error("Failed to upload cloth image");
      }

      const { url: clothesImageUrl } = await clothUploadResponse.json();

      // Generate with pipeline
      const generateResponse = await fetch("/api/tools/replace-cloth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterImageUrl,
          clothesImageUrl,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!isAuthenticated ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to generate images.{" "}
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
            </Button>{" "}
            to continue.
          </AlertDescription>
        </Alert>
      ) : (
        /* Upload & Generate - Only shown for authenticated users */
        <Card>
          <CardHeader>
            <CardTitle>Try It Yourself</CardTitle>
            <CardDescription>
              Upload your image and generate results
            </CardDescription>
            <div className="flex flex-col gap-2 text-sm mt-2">
              {(characterFile || clothFile) && (
                <div className="flex flex-col gap-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Estimated cost:</span>
                    <span>{estimatedCost} credits</span>
                  </div>
                  {(characterCost > 0 || clothCost > 0) && (
                    <div className="flex flex-col gap-1 text-xs ml-4">
                      {characterCost > 0 && (
                        <span>Character image: {characterCost} credits</span>
                      )}
                      {clothCost > 0 && (
                        <span>Cloth image: {clothCost} credits</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Character Image Upload */}
            <div className="space-y-2">
              <label htmlFor="character-upload" className="text-sm font-medium">
                Character Image
              </label>
              <label
                htmlFor="character-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (MAX. 10MB)
                  </p>
                </div>
                <input
                  id="character-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCharacterFileChange}
                />
              </label>
              {characterPreviewUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <NextImage
                    src={characterPreviewUrl}
                    alt="Character preview"
                    fill
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Cloth Image Upload */}
            <div className="space-y-2">
              <label htmlFor="cloth-upload" className="text-sm font-medium">
                Cloth Image
              </label>
              <label
                htmlFor="cloth-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (MAX. 10MB)
                  </p>
                </div>
                <input
                  id="cloth-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleClothFileChange}
                />
              </label>
              {clothPreviewUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <NextImage
                    src={clothPreviewUrl}
                    alt="Cloth preview"
                    fill
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            {characterFile && clothFile && (
              <div className="space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || userCredits < estimatedCost}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Generate ({estimatedCost} credits)
                    </>
                  )}
                </Button>
                {userCredits < estimatedCost && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient credits. You need {estimatedCost} credits but
                      only have {userCredits}.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push("/credits/top-up")}
                      >
                        Buy more credits
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Result */}
            {outputUrl && characterPreviewUrl && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Result</h3>
                <BeforeAfterSlider
                  beforeImage={characterPreviewUrl}
                  afterImage={outputUrl}
                  alt="Generated result"
                />
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  asChild
                >
                  <a
                    href={outputUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Result
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
