/**
 * Formats a timestamptz value deterministically (fixed locale + UTC), so
 * Server/Client Components that render the same date produce identical
 * output regardless of the server's or browser's locale - avoiding React
 * hydration mismatches when a date is formatted inside a Client Component.
 */
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" });
}
