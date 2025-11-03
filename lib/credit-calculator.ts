export function calculateCreditCost(
  baseCost: number,
  width: number,
  height: number,
): number {
  const megapixels = (width * height) / 1_000_000;
  // Round up to ensure we always charge at least the base cost
  return Math.max(baseCost, Math.ceil(baseCost * megapixels));
}

/**
 * Get image dimensions from a File or URL
 * @param source - File object or image URL
 * @returns Promise with width and height
 */
export async function getImageDimensions(
  source: File | string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(source);
    }
  });
}
