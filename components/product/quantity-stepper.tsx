"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * Stepper with a directly editable input. Buyers of provisions and fabrics buy
 * in bulk and will not tap "+" twelve times. The ceiling is never silently
 * clamped — we say why it stopped.
 */
export function QuantityStepper({
  value,
  onChange,
  max,
  stock,
  maxPerOrder,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  stock: number;
  maxPerOrder: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const atCeiling = value >= max;
  const reason = stock <= maxPerOrder ? `Only ${stock} left` : `Maximum ${maxPerOrder} per order`;

  return (
    <div>
      <div className="inline-flex items-center rounded-md border border-border">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="tap-target flex items-center justify-center rounded-l-md text-foreground disabled:text-subtle-foreground"
        >
          <Minus size={16} />
        </button>
        <label className="sr-only" htmlFor="qty-input">
          Quantity
        </label>
        <input
          id="qty-input"
          type="number"
          inputMode="numeric"
          value={draft ?? value}
          // Digits only while typing; clamp on blur, never on keystroke.
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={() => {
            const parsed = Number(draft ?? value);
            onChange(Math.min(Math.max(1, Number.isFinite(parsed) && parsed > 0 ? parsed : 1), max));
            setDraft(null);
          }}
          className="h-11 w-14 border-x border-border text-center text-body text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={atCeiling}
          className="tap-target flex items-center justify-center rounded-r-md text-foreground disabled:text-subtle-foreground"
        >
          <Plus size={16} />
        </button>
      </div>
      {atCeiling ? <p className="mt-1 text-small text-warning">{reason}</p> : null}
    </div>
  );
}
