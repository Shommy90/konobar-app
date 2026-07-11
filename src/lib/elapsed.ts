/** `now` is the value from useNow() - pass null to render nothing yet. */
export function formatElapsedMinutes(startIso: string, now: number | null): string {
  if (now === null) return "";
  const startMs = new Date(startIso).getTime();
  const minutes = Math.max(0, Math.round((now - startMs) / 60000));
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

/** `now` is the value from useNow() - pass null to render nothing yet. */
export function formatRemainingMinutes(expiresAtIso: string | null, now: number | null): string {
  if (now === null || expiresAtIso === null) return "";
  const expiresMs = new Date(expiresAtIso).getTime();
  const minutes = Math.round((expiresMs - now) / 60000);
  if (minutes <= 0) return "expiring";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}
