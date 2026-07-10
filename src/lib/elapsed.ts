/** `now` is the value from useNow() - pass null to render nothing yet. */
export function formatElapsedMinutes(startIso: string, now: number | null): string {
  if (now === null) return "";
  const startMs = new Date(startIso).getTime();
  const minutes = Math.max(0, Math.round((now - startMs) / 60000));
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}
