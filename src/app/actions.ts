"use server";

import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

export async function generateImageAction(imageDataUrl: string) {
  try {
    const result = await fal.subscribe("fal-ai/qwen-image-edit-plus-lora", {
      input: {
        prompt: "make image realistic",
        image_urls: [imageDataUrl],
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
    // Extract detailed error message from fal.ai API response
    let errorMessage = "Unknown error occurred";
    
    if (error && typeof error === 'object') {
      if ('status' in error) {
        console.error("Error status:", error.status);
      }
      console.error("Error properties:", Object.keys(error));
      
      // Check for fal.ai API error structure
      if ('body' in error && error.body && typeof error.body === 'object') {
        console.error("Error body:", error.body);
        
        // Check for detail array with validation errors
        if ('detail' in error.body && Array.isArray(error.body.detail) && error.body.detail.length > 0) {
          const firstError = error.body.detail[0];
          if ('msg' in firstError) {
            errorMessage = firstError.msg;
            console.error("Extracted error message:", errorMessage);
          }
        }
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
