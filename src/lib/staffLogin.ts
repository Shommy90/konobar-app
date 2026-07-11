const STAFF_EMAIL_DOMAIN = "staff.konobar.internal";
const NICKNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(value);
}

/**
 * Supabase Auth is email-based, so STAFF accounts (which log in with a
 * nickname, not an email) still get a deterministic synthetic email under
 * the hood. Since it's derived from the nickname alone, login never needs
 * a database lookup to resolve one from the other.
 */
export function nicknameToStaffEmail(nickname: string): string {
  return `${nickname.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}
