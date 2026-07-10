"use client";

import { useEffect, useState } from "react";

/**
 * Ticks every `intervalMs`, returning null until the first tick. Never
 * calls Date.now() during the initial render (that would differ between
 * the server render pass and the client hydration pass) - the first
 * update is deferred via setTimeout so it still lands almost immediately
 * without being a synchronous effect-body setState call.
 */
export function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
