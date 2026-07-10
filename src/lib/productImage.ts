const PRODUCT_IMAGES_BUCKET = "product-images";

/** Storage object path: restaurants/{restaurantId}/products/{productId}/{uuid}.webp */
export function buildProductImagePath(restaurantId: string, productId: string): string {
  return `restaurants/${restaurantId}/products/${productId}/${crypto.randomUUID()}.webp`;
}

/** The bucket is public, so this is a plain deterministic URL - no network call, no auth needed. */
export function getProductImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${imagePath}`;
}

export { PRODUCT_IMAGES_BUCKET };
