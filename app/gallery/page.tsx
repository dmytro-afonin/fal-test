import Image from "next/image";
import { redirect } from "next/navigation";
import { BeforeAfterSlider } from "@/components/common/before-after-slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function GalleryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch completed generations for the current user
  const { data: generations } = await supabase
    .from("fal_generations")
    .select(
      `
      id,
      status,
      image_urls,
      input_data,
      preset_id,
      created_at,
      fal_presets (
        id,
        name,
        description
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Transform generations to include input and output images
  const galleryItems =
    generations?.map((gen) => {
      const inputData = gen.input_data as {
        image_urls?: string[];
        [key: string]: unknown;
      };
      const inputImageUrl =
        Array.isArray(inputData?.image_urls) && inputData.image_urls.length > 0
          ? inputData.image_urls[0]
          : null;

      const outputImageUrl =
        Array.isArray(gen.image_urls) && gen.image_urls.length > 0
          ? gen.image_urls[0]
          : null;

      return {
        id: gen.id,
        inputImage: inputImageUrl,
        outputImage: outputImageUrl,
        presetName: (gen.fal_presets as { name?: string })?.name || "Unknown",
        presetDescription:
          (gen.fal_presets as { description?: string })?.description || "",
        createdAt: gen.created_at,
      };
    }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Gallery</h1>
          <p className="text-muted-foreground">
            View all your completed image generations
          </p>
        </div>

        {galleryItems.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">No generations yet</h2>
            <p className="text-muted-foreground mb-6">
              Start creating images to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden transition-all hover:shadow-lg"
              >
                <CardContent className="p-0">
                  {item.inputImage && item.outputImage ? (
                    <BeforeAfterSlider
                      beforeImage={item.inputImage}
                      afterImage={item.outputImage}
                      alt={item.presetName}
                    />
                  ) : item.outputImage ? (
                    <div className="relative w-full aspect-square bg-muted">
                      <Image
                        src={item.outputImage}
                        alt={item.presetName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        No image available
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardHeader>
                  <CardTitle className="text-lg">{item.presetName}</CardTitle>
                  {item.presetDescription && (
                    <CardDescription className="line-clamp-2">
                      {item.presetDescription}
                    </CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
