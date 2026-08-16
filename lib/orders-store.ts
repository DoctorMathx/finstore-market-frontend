"use client";

import { useMemo } from "react";
import type { CartGroup } from "@/components/cart/use-cart-validation";
import { createStorageStore, useHydrated, useStorageStore } from "./client-store";

/**
 * Placed orders live in localStorage for this build. The shape mirrors what the
 * order service will return: sub-orders are the primary unit, because that is
 * what actually ships and what settles.
 */
export type StoredSubOrder = {
  id: string;
  merchant: CartGroup["merchant"];
  items: { title: string; imageSeed: string; quantity: number; unitPrice: number; variantLabel?: string; href: string }[];
  subtotal: number;
  deliveryCost: number;
  estimatedDate?: string;
  status:
    | "awaiting_confirmation"
    | "preparing"
    | "on_the_way"
    | "delivered"
    | "completed"
    | "cancelled"
    | "issue_raised";
  deliveredAt?: string;
  riderName?: string;
  riderPhone?: string;
};

export type StoredOrder = {
  id: string;
  placedAt: string;
  idempotencyKey: string;
  subOrders: StoredSubOrder[];
  itemsTotal: number;
  deliveryTotal: number;
  discount?: { label: string; amount: number };
  total: number;
  address: Record<string, string>;
  paymentMethod: string;
  currency: "NGN" | "GHS" | "KES" | "ZAR";
};

const ordersStore = createStorageStore<StoredOrder[]>("fm_orders", []);

export function saveOrder(order: StoredOrder): void {
  // The idempotency key is what stops a double-submit becoming a double charge.
  ordersStore.set((existing) =>
    existing.some((o) => o.idempotencyKey === order.idempotencyKey) ? existing : [order, ...existing],
  );
}

export function updateOrder(id: string, mutate: (order: StoredOrder) => StoredOrder): void {
  ordersStore.set((orders) => orders.map((o) => (o.id === id ? mutate(o) : o)));
}

/** Every order on this device. `hydrated` is false only during SSR/hydration. */
export function useOrders(): { orders: StoredOrder[]; hydrated: boolean } {
  const orders = useStorageStore(ordersStore);
  const hydrated = useHydrated();
  return { orders, hydrated };
}

/** One order by id. `order` is null once hydrated and genuinely absent. */
export function useOrder(id: string): { order: StoredOrder | null; hydrated: boolean } {
  const { orders, hydrated } = useOrders();
  const order = useMemo(() => orders.find((o) => o.id === id) ?? null, [orders, id]);
  return { order, hydrated };
}

export function newOrderId(): string {
  const n = Math.floor(Math.random() * 900_000) + 100_000;
  return `FM-${new Date().getFullYear()}-${n}`;
}

export const STATUS_LABELS: Record<StoredSubOrder["status"], { label: string; tone: string }> = {
  awaiting_confirmation: { label: "Awaiting confirmation", tone: "warning" },
  preparing: { label: "Preparing your order", tone: "violet" },
  on_the_way: { label: "On the way", tone: "violet" },
  delivered: { label: "Delivered", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  issue_raised: { label: "Issue raised", tone: "danger" },
};
