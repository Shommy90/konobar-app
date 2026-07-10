export type StoredGuestSession = {
  restaurantId: string;
  tableId: string;
  sessionId: string;
  sessionToken: string;
};

function sessionKey(tableToken: string): string {
  return `konobar:session:${tableToken}`;
}

export function loadStoredSession(tableToken: string): StoredGuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(tableToken));
    return raw ? (JSON.parse(raw) as StoredGuestSession) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(tableToken: string, session: StoredGuestSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionKey(tableToken), JSON.stringify(session));
}

export function clearStoredSession(tableToken: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionKey(tableToken));
}
