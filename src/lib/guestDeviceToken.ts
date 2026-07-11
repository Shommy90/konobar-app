function deviceTokenKey(tableToken: string): string {
  return `konobar:device:${tableToken}`;
}

/**
 * Identifies this browser to the table-session takeover logic in
 * place_guest_order (0015_guest_ordering_sessions.sql) - not a security
 * credential, just enough to tell "same device ordering again" apart from
 * "a different device ordering at this table now". Persisted per table in
 * localStorage: once this device's session at a table has ended, it stays
 * locked out from ordering there under this same token (see
 * SessionEndedScreen) until localStorage is cleared or a different
 * device/browser is used - a plain page refresh can't be told apart from
 * an actual QR rescan at the HTTP level, so re-scanning in the same
 * browser won't by itself unlock a new session.
 */
export function getOrCreateGuestDeviceToken(tableToken: string): string {
  if (typeof window === "undefined") return "";

  const key = deviceTokenKey(tableToken);
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const token = window.crypto.randomUUID();
  window.localStorage.setItem(key, token);
  return token;
}
