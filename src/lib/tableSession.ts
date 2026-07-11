/**
 * How long a table session stays valid after its most recent successful
 * order. Every successful order resets the window; enforced server-side in
 * the place_guest_order/resolve_guest_session/get_my_session RPCs
 * (0015_guest_ordering_sessions.sql) - this constant exists only so the
 * guest UI's copy/expectations stay in sync with that SQL-side value.
 */
export const SESSION_TIMEOUT_HOURS = 2;

/**
 * Guest-facing copy for a SESSION_INACTIVE rejection from place_guest_order.
 * Lives here (a plain module) rather than in actions.ts, since a "use
 * server" file may only export async functions - not a const.
 */
export const SESSION_EXPIRED_MESSAGE =
  "Your table session has expired. Please scan the QR code again.";
