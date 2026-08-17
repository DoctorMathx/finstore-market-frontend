"use client";

import type { PdpModel } from "@/lib/pdp";

const SWATCHES: Record<string, string> = {
  Black: "#0F172A",
  White: "#FFFFFF",
  Blue: "#2563EB",
  Silver: "#CBD5E1",
  Gold: "#D4AF37",
  Green: "#16A34A",
  Red: "#DC2626",
  Grey: "#64748B",
};

/**
 * Maximum two axes. Unavailable combinations render disabled with a diagonal
 * strike rather than being hidden — hiding an option makes the buyer think it
 * does not exist at all.
 */
export function VariantSelector({
  model,
  variantId,
  onSelect,
}: {
  model: PdpModel;
  variantId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const selected = model.variants.find((v) => v.id === variantId);
  const chosen: Record<string, string> = selected ? { ...selected.attributes } : {};

  function pick(axisKey: string, value: string) {
    const next = { ...chosen, [axisKey]: value };
    // Prefer an exact match; otherwise hold the axis the buyer just touched and
    // fall back to the cheapest in-stock variant that satisfies it.
    const exact = model.variants.find((v) =>
      Object.entries(next).every(([k, val]) => v.attributes[k] === val),
    );
    if (exact) return onSelect(exact.id);

    const partial = model.variants
      .filter((v) => v.attributes[axisKey] === value && v.stock > 0)
      .sort((a, b) => a.priceMinor - b.priceMinor)[0];
    onSelect(partial?.id);
  }

  return (
    <div className="flex flex-col gap-3">
      {model.axes.map((axis, axisIndex) => {
        const isSwatch = axis.key === "colour";
        return (
          <fieldset key={axis.key}>
            <legend className="mb-1.5 text-small text-muted-foreground">
              {axis.label}:{" "}
              <span className="font-semibold text-foreground">{chosen[axis.key] ?? "Select"}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {axis.values.map((value) => {
                const combos = model.variants.filter((v) => {
                  if (v.attributes[axis.key] !== value) return false;
                  // Availability is judged against the other axis's current choice.
                  return model.axes.every(
                    (other) => other.key === axis.key || !chosen[other.key] || v.attributes[other.key] === chosen[other.key],
                  );
                });
                const available = combos.some((v) => v.stock > 0);
                const active = chosen[axis.key] === value;

                if (isSwatch && axisIndex === 0) {
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pick(axis.key, value)}
                      disabled={!available}
                      aria-pressed={active}
                      aria-label={`${value}${available ? "" : " — unavailable"}`}
                      title={value}
                      className={`relative h-10 w-10 rounded-full border-2 ${
                        active ? "border-primary" : "border-border"
                      } ${available ? "" : "cursor-not-allowed opacity-60"}`}
                      style={{ backgroundColor: SWATCHES[value] ?? "#E2E8F0" }}
                    >
                      {!available ? <Strike /> : null}
                    </button>
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => pick(axis.key, value)}
                    disabled={!available}
                    aria-pressed={active}
                    className={`tap-target relative rounded-md border px-3 text-small font-medium ${
                      active ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-foreground"
                    } ${available ? "" : "cursor-not-allowed text-subtle-foreground"}`}
                  >
                    {value}
                    {!available ? <Strike /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function Strike() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      <line x1="0" y1="100" x2="100" y2="0" stroke="#94A3B8" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
