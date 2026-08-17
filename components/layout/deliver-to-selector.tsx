"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { subRegionsFor } from "@/lib/country";
import { useMarket } from "@/components/providers";

/**
 * Sets the destination that drives every delivery estimate and shipping cost on
 * the site. Persisted in a cookie so it survives before login.
 */
export function DeliverToSelector({ variant = "header" }: { variant?: "header" | "inline" }) {
  const { config, deliverTo, setDeliverTo } = useMarket();
  const [open, setOpen] = useState(false);
  // Drafts only matter while the popover is open, so they are seeded at open
  // time rather than synced from context by an effect.
  const [region, setRegion] = useState(deliverTo.region);
  const [subRegion, setSubRegion] = useState(deliverTo.subRegion);
  const ref = useRef<HTMLDivElement>(null);

  function toggleOpen() {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        setRegion(deliverTo.region);
        setSubRegion(deliverTo.subRegion);
      }
      return !wasOpen;
    });
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const subRegions = subRegionsFor(config, region);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        aria-expanded={open}
        className={
          variant === "header"
            ? "tap-target flex items-center gap-1.5 rounded-md px-2 text-left hover:bg-chrome-hover"
            : "inline-flex items-center gap-1 text-small font-medium text-primary-strong hover:underline"
        }
      >
        <MapPin size={variant === "header" ? 18 : 14} className={`shrink-0 ${variant === "header" ? "text-chrome-muted" : "text-subtle-foreground"}`} />
        {variant === "header" ? (
          <span className="leading-tight">
            <span className="block text-micro text-chrome-muted">Deliver to</span>
            <span className="block max-w-[140px] truncate text-small font-semibold text-chrome-foreground">
              {deliverTo.subRegion}, {deliverTo.region}
            </span>
          </span>
        ) : (
          <span>
            Deliver to {deliverTo.subRegion}, {deliverTo.region}
          </span>
        )}
        <ChevronDown size={14} className={`shrink-0 ${variant === "header" ? "text-chrome-muted" : "text-subtle-foreground"}`} />
      </button>

      {open ? (
        <div className="chrome-surface absolute left-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-chrome-border bg-chrome-raised p-4 shadow-xl">
          <p className="mb-3 text-body font-semibold text-chrome-foreground">Choose your delivery area</p>
          <label className="mb-1 block text-small text-chrome-muted" htmlFor="deliver-region">
            {config.regionLabel}
          </label>
          <select
            id="deliver-region"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setSubRegion(subRegionsFor(config, e.target.value)[0]);
            }}
            className="mb-3 h-11 w-full rounded-md border border-chrome-border px-2 text-body text-chrome-foreground"
          >
            {config.regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="mb-1 block text-small text-chrome-muted" htmlFor="deliver-subregion">
            {config.subRegionLabel}
          </label>
          <select
            id="deliver-subregion"
            value={subRegion}
            onChange={(e) => setSubRegion(e.target.value)}
            className="mb-4 h-11 w-full rounded-md border border-chrome-border px-2 text-body text-chrome-foreground"
          >
            {subRegions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setDeliverTo({ region, subRegion });
              setOpen(false);
            }}
            className="tap-target w-full rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
