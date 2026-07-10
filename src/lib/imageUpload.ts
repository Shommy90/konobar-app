import { createClient } from "@/lib/supabase/client";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/productImage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.85;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, or WebP images are allowed.";
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return "Image must be smaller than 5 MB.";
  }
  return null;
}

/** Downscales (never upscales) to fit within 1200x1200 and re-encodes as WebP. */
export async function resizeImageToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }
  context.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image."))),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

export async function uploadProductImage(path: string, blob: Blob): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, blob, { contentType: "image/webp", upsert: false });

  return error?.message ?? null;
}

export async function deleteProductImage(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}
