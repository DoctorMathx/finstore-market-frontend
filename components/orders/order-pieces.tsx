"use client";

import { Check, Truck } from "lucide-react";
import { STATUS_LABELS, type StoredSubOrder } from "@/lib/orders-store";
import { Badge } from "@/components/ui";

export function OrderStatusChip({ status }: { status: StoredSubOrder["status"] }) {
  const { label, tone } = STATUS_LABELS[status];
  const map: Record<string, "neutral" | "success" | "warning" | "danger" | "brand"> = {
    neutral: "neutral",
    success: "success",
    warning: "warning",
    danger: "danger",
    violet: "brand",
  };
  return <Badge tone={map[tone] ?? "neutral"}>{label}</Badge>;
}

const STEPS: { key: StoredSubOrder["status"]; label: string; body: string }[] = [
  { key: "awaiting_confirmation", label: "Order placed", body: "We are waiting for the store to confirm." },
  { key: "preparing", label: "Store confirmed", body: "Your item is being packed." },
  { key: "on_the_way", label: "Picked up", body: "The item is with the rider." },
  { key: "delivered", label: "Out for delivery", body: "Arriving at your address." },
  { key: "completed", label: "You confirm receipt", body: "The store gets paid at this point." },
];

const ORDER: StoredSubOrder["status"][] = [
  "awaiting_confirmation",
  "preparing",
  "on_the_way",
  "delivered",
  "completed",
];

/** Completed steps filled orange, current step pulsing, future steps outlined. */
export function OrderTimeline({ status }: { status: StoredSubOrder["status"] }) {
  const currentIndex = ORDER.indexOf(status);

  return (
    <ol className="flex flex-col">
      {STEPS.map((step, index) => {
        const done = currentIndex > index;
        const current = currentIndex === index;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : current
                      ? "pulse-ring border-primary bg-card text-primary-strong"
                      : "border-border bg-card text-subtle-foreground"
                }`}
              >
                {done ? <Check size={14} /> : <span className="text-micro font-semibold">{index + 1}</span>}
              </span>
              {index < STEPS.length - 1 ? (
                <span className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />
              ) : null}
            </div>
            <div className={`pb-5 ${index === STEPS.length - 1 ? "pb-0" : ""}`}>
              <p className={`text-body font-medium ${done || current ? "text-foreground" : "text-subtle-foreground"}`}>
                {step.label}
              </p>
              <p className="text-small text-muted-foreground">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RiderContact({ name, phone }: { name: string; phone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background-alt p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
        <Truck size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-foreground">{name}</p>
        <p className="text-small text-muted-foreground">Your rider</p>
      </div>
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className="tap-target flex shrink-0 items-center rounded-md border border-border px-3 text-small font-medium text-foreground"
      >
        Call
      </a>
    </div>
  );
}
