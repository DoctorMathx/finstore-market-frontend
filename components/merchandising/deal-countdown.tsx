"use client";

import { useEffect, useState } from "react";

/**
 * Computed from a server-supplied end timestamp — device clocks in this market
 * are frequently wrong, so we never derive the deal window from client time
 * alone, only the tick. Rendered only when the deal ends within 48 hours.
 */
const WINDOW_MS = 48 * 3_600_000;

export function DealCountdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = Date.parse(endsAt);
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  // First paint matches the server (nothing), so there is no hydration mismatch.
  if (remaining === null || remaining > WINDOW_MS) return null;

  if (remaining <= 0) {
    return (
      <p className={`text-micro font-medium text-subtle-foreground ${compact ? "" : "mt-1"}`}>This deal has ended</p>
    );
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const urgent = remaining < 3_600_000;

  return (
    <p
      className={`text-micro font-semibold tabular-nums ${urgent ? "text-destructive" : "text-warning"}`}
      aria-live="off"
    >
      Ends in {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </p>
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** True when a timer is worth rendering at all. */
export function hasLiveTimer(endsAt?: string): boolean {
  if (!endsAt) return false;
  const remaining = Date.parse(endsAt) - Date.now();
  return remaining > 0 && remaining <= WINDOW_MS;
}
