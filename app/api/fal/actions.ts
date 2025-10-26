"use server";

import { fal } from "@fal-ai/client";
import { handleFalError } from "./helpers";

export async function generateImageAction(imageUrl: string) {
  try {

    const result = await fal.subscribe("fal-ai/qwen-image-edit-plus-lora", {
      input: {
        prompt: "make image realistic",
        image_urls: [imageUrl],
        loras: [{
          path: "https://huggingface.co/WILDFAL/wildfaltest_qwwen_edit/resolve/main/A2R_2509_Base.safetensors?download=true",
          scale: 1.0
        }]
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(update);
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (result.data && result.data.images && result.data.images.length > 0) {
      return {
        success: true,
        imageUrl: result.data.images[0].url,
      };
    } else {
      return {
        success: false,
        error: "Failed to generate image - no images returned",
      };
    }
  } catch (error) {
    console.error("Generate error:", error);
    return {
      success: false,
      error: handleFalError(error),
    };
  }
}
