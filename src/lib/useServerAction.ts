"use client";

import { useState } from "react";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Wraps a single server-action call with loading/error state, for the many
 * one-click toggle/delete buttons across the app (activate/deactivate, mark
 * available, delete) that previously each hand-rolled the same
 * useState(false) x2 dance.
 */
export function useServerAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<ActionResult>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(...args: Args): Promise<boolean> {
    setLoading(true);
    setError(null);
    const result = await action(...args);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    return true;
  }

  return { run, loading, error, setError };
}
