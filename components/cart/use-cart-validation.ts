"use client";

import { useEffect, useState } from "react";
import type { CartLine, CartValidation } from "@/lib/cart-types";
import { useCart, useMarket } from "@/components/providers";

export type CartGroup = {
  merchant: CartLine["merchant"];
  lines: (CartLine & { currentPrice: number; stock: number })[];
  subtotal: number;
  deliveryCost: number;
  estimatedDate?: string;
};

export type CartState = {
  loading: boolean;
  failed: boolean;
  groups: CartGroup[];
  /** Went out of stock since add — excluded from the total, cannot block checkout. */
  unavailable: CartLine[];
  itemsTotal: number;
  deliveryTotal: number;
  total: number;
  retry: () => void;
};

export function useCartValidation(): CartState {
  const { lines, hydrated } = useCart();
  const { deliverTo, locale } = useMarket();
  const [validation, setValidation] = useState<CartValidation | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Loading and failure are derived from which request last settled, so the
  // effect never has to set state synchronously.
  const [settled, setSettled] = useState<{ key: string; failed: boolean } | null>(null);

  const key =
    JSON.stringify(lines.map((l) => [l.productId, l.variantId, l.quantity])) +
    `|${deliverTo.region}|${attempt}`;

  const loading = hydrated && lines.length > 0 && settled?.key !== key;
  const failed = settled?.key === key && settled.failed;

  useEffect(() => {
    if (!hydrated || !lines.length) return;
    let cancelled = false;
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines, destinationState: deliverTo.region, locale }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("validation failed");
        return r.json();
      })
      .then((data: CartValidation) => {
        if (cancelled) return;
        setValidation(data);
        setSettled({ key, failed: false });
      })
      .catch(() => {
        if (!cancelled) setSettled({ key, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, hydrated, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups: CartGroup[] = [];
  const unavailable: CartLine[] = [];

  for (const line of lines) {
    const v = validation?.lines.find((l) => l.productId === line.productId && l.variantId === line.variantId);
    if (validation && v && !v.available) {
      unavailable.push(line);
      continue;
    }
    const merchantGroup =
      groups.find((g) => g.merchant.id === line.merchant.id) ??
      (groups.push({
        merchant: line.merchant,
        lines: [],
        subtotal: 0,
        deliveryCost: 0,
        estimatedDate: undefined,
      }),
      groups[groups.length - 1]);

    merchantGroup.lines.push({ ...line, currentPrice: v?.currentPrice ?? line.priceAtAdd, stock: v?.stock ?? 99 });
  }

  for (const group of groups) {
    group.subtotal = group.lines.reduce((sum, l) => sum + l.currentPrice * l.quantity, 0);
    const quote = validation?.groups.find((g) => g.merchantId === group.merchant.id);
    group.deliveryCost = quote?.deliveryCost ?? 0;
    group.estimatedDate = quote?.estimatedDate;
  }

  const itemsTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const deliveryTotal = groups.reduce((sum, g) => sum + g.deliveryCost, 0);

  return {
    loading,
    failed,
    groups,
    unavailable,
    itemsTotal,
    deliveryTotal,
    total: itemsTotal + deliveryTotal,
    retry: () => setAttempt((a) => a + 1),
  };
}
