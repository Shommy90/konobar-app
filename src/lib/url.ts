import { headers } from "next/headers";

/**
 * Derives the current request's origin so QR codes/links are correct in
 * both local dev and production without a separate site-url env var.
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

export function getGuestTableUrl(baseUrl: string, restaurantSlug: string, tableToken: string) {
  return `${baseUrl}/r/${restaurantSlug}/table/${tableToken}`;
}
