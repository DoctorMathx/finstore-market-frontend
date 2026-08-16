"use client";

import { useEffect } from "react";
import { useSaved } from "@/components/providers";

/** Feeds the recently-viewed rail. Local only — nothing leaves the device. */
export function ViewTracker({ productId }: { productId: string }) {
  const { recordView } = useSaved();
  useEffect(() => {
    recordView(productId);
  }, [productId, recordView]);
  return null;
}
