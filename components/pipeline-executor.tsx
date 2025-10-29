"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, AlertCircle, Coins } from "lucide-react"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface PipelineExecutorProps {
  pipeline: {
    id: string
    name: string
    description: string
    before_image_url: string
    after_image_url: string
    credit_cost: number
  }
}

export function PipelineExecutor({ pipeline }: PipelineExecutorProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(pipeline.credit_cost)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        // Fetch user credits
        const response = await fetch("/api/user/credits")
        if (response.ok) {
          const data = await response.json()
          setUserCredits(data.credits)
        }
      }
    }

    checkAuth()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setOutputUrl(null)
      setError(null)

      const img = new Image()
      img.onload = () => {
        const megapixels = (img.width * img.height) / 1_000_000
        const cost = Math.max(pipeline.credit_cost, Math.ceil(pipeline.credit_cost * megapixels))
        setEstimatedCost(cost)
      }
      img.src = url
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) return

    if (userCredits < estimatedCost) {
      setError(`Insufficient credits. You need ${estimatedCost} credits but only have ${userCredits}.`)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Upload image
      const formData = new FormData()
      formData.append("file", selectedFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const { url: imageUrl } = await uploadResponse.json()

      // Generate with pipeline
      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pipelineId: pipeline.id,
          imageUrl,
        }),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        if (generateResponse.status === 402) {
          throw new Error(`Insufficient credits. Required: ${errorData.required}, Available: ${errorData.available}`)
        }
        throw new Error(errorData.error || "Failed to generate image")
      }

      const { outputImageUrl, creditsUsed, creditsRemaining } = await generateResponse.json()
      setOutputUrl(outputImageUrl)
      setUserCredits(creditsRemaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Example */}
      <Card>
        <CardHeader>
          <CardTitle>Example Result</CardTitle>
          <CardDescription>See what this pipeline can do</CardDescription>
        </CardHeader>
        <CardContent>
          <BeforeAfterSlider
            beforeImage={pipeline.before_image_url}
            afterImage={pipeline.after_image_url}
            alt={pipeline.name}
          />
        </CardContent>
      </Card>

      {!isAuthenticated ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to generate images.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/auth/login")}>
              Log in
            </Button>{" "}
            or{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/auth/sign-up")}>
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
            <CardDescription>Upload your image and generate results</CardDescription>
            <div className="flex items-center gap-4 text-sm mt-2">
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4" />
                <span>Your balance: {userCredits} credits</span>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Estimated cost: {estimatedCost} credits</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload */}
            <div>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain" />
                </div>
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
                      Insufficient credits. You need {estimatedCost} credits but only have {userCredits}.{" "}
                      <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/credits/top-up")}>
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
            {outputUrl && previewUrl && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Result</h3>
                <BeforeAfterSlider beforeImage={previewUrl} afterImage={outputUrl} alt="Generated result" />
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <a href={outputUrl} download target="_blank" rel="noopener noreferrer">
                    Download Result
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
