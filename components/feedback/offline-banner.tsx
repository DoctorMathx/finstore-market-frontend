"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/components/providers";

/** Persistent while offline. Cart writes stay in localStorage and replay. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="sticky top-0 z-[55] flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-small text-background">
      <WifiOff size={16} />
      You are offline. Cart changes are saved and will sync when you reconnect.
    </div>
  );
}
