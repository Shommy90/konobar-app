import type { KeyboardEvent } from "react";

/**
 * Attach to plain text/number/date TextFields (not `select` ones - there,
 * Enter should pick the highlighted menu option, not submit the form).
 * Native implicit form submission on Enter can be unreliable inside MUI's
 * portaled Dialogs, so this triggers it explicitly and deterministically.
 */
export function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}
