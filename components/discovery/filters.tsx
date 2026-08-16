"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { FacetKey } from "@/lib/taxonomy";
import type { FacetOption } from "@/lib/plp";
import { SORT_OPTIONS, type SortKey } from "@/lib/plp";
import { RatingStars } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FacetGroup = { key: FacetKey; options: FacetOption[] };
export type PricePreset = { label: string; min?: number; max?: number };

const FACET_LABELS: Record<string, string> = {
  price: "Price",
  brand: "Brand",
  condition: "Condition",
  rating: "Rating",
  shipsFrom: "Ships from",
  delivery: "Delivery speed",
  discount: "Discount",
  size: "Size",
  colour: "Colour",
  storage: "Storage",
  capacity: "Capacity",
  weight: "Weight",
};

/** Facets whose values are a set the buyer can multi-select. */
const MULTI: FacetKey[] = ["brand", "shipsFrom", "size", "colour", "storage", "capacity", "weight", "discount"];

function optionLabel(key: FacetKey, value: string): string {
  if (key === "condition") return value[0].toUpperCase() + value.slice(1);
  if (key === "rating") return `${value}★ & up`;
  if (key === "delivery") return value === "next-day" ? "Next day" : "2–3 days";
  if (key === "discount") return `${value}% or more`;
  return value;
}

/** All filter state lives in the URL — shareable, back-button correct, SSR-able. */
function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const commit = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page"); // any filter change returns to page 1
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
    });
  };

  const values = (key: string) => (searchParams.get(key) ?? "").split(",").filter(Boolean);

  const toggle = (key: FacetKey, value: string) =>
    commit((params) => {
      if (MULTI.includes(key)) {
        const current = new Set((params.get(key) ?? "").split(",").filter(Boolean));
        if (current.has(value)) current.delete(value);
        else current.add(value);
        if (current.size) params.set(key, [...current].join(","));
        else params.delete(key);
      } else if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

  const setPrice = (min?: number, max?: number) =>
    commit((params) => {
      if (min == null && max == null) params.delete("price");
      else params.set("price", `${min ?? 0}-${max ?? ""}`);
    });

  const clearAll = () =>
    commit((params) => {
      const q = params.get("q");
      const sort = params.get("sort");
      [...params.keys()].forEach((k) => params.delete(k));
      if (q) params.set("q", q);
      if (sort) params.set("sort", sort);
    });

  const setSort = (sort: SortKey) => commit((params) => params.set("sort", sort));

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: true });
    });
  };

  return { values, toggle, setPrice, clearAll, setSort, goToPage, pending, searchParams };
}

/* ------------------------------------------------------------------- rail */

export function FilterRail({
  facets,
  pricePresets,
  currencySymbol,
}: {
  facets: FacetGroup[];
  pricePresets: PricePreset[];
  currencySymbol: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
      <FilterGroups facets={facets} pricePresets={pricePresets} currencySymbol={currencySymbol} />
    </aside>
  );
}

function FilterGroups({
  facets,
  pricePresets,
  currencySymbol,
}: {
  facets: FacetGroup[];
  pricePresets: PricePreset[];
  currencySymbol: string;
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <PriceFilter presets={pricePresets} currencySymbol={currencySymbol} />
      {facets
        .filter((f) => f.key !== "price" && f.options.length > 0)
        .map((facet) => (
          <FilterGroup key={facet.key} facet={facet} />
        ))}
    </div>
  );
}

function FilterGroup({ facet }: { facet: FacetGroup }) {
  const { values, toggle } = useFilterState();
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const selected = values(facet.key);
  const searchable = facet.options.length > 12;
  const filtered = search
    ? facet.options.filter((o) => o.value.toLowerCase().includes(search.toLowerCase()))
    : facet.options;
  const visible = expanded ? filtered : filtered.slice(0, 8);

  return (
    <section className="py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-1 flex w-full items-center justify-between text-left text-small font-semibold text-foreground"
      >
        {FACET_LABELS[facet.key] ?? facet.key}
        <ChevronDown size={14} className={`text-subtle-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open ? (
        <>
          {searchable ? (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${FACET_LABELS[facet.key]?.toLowerCase()}`}
              className="mb-2 h-9 w-full rounded-md border border-border px-2 text-small text-foreground"
            />
          ) : null}

          <ul className="space-y-1">
            {visible.map((option) => {
              const checked = selected.includes(option.value);
              const isRadio = !MULTI.includes(facet.key);
              return (
                <li key={option.value}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 py-1 text-small ${
                      option.disabled && !checked ? "cursor-not-allowed text-subtle-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <input
                      type={isRadio ? "radio" : "checkbox"}
                      name={isRadio ? facet.key : undefined}
                      checked={checked}
                      disabled={option.disabled && !checked}
                      onChange={() => toggle(facet.key, option.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    {facet.key === "rating" ? (
                      <span className="flex items-center gap-1">
                        <RatingStars value={Number(option.value)} size={12} />
                        <span>&amp; up</span>
                      </span>
                    ) : (
                      <span className="flex-1">{optionLabel(facet.key, option.value)}</span>
                    )}
                    <span className="text-micro text-subtle-foreground">{option.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {filtered.length > 8 ? (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-small font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : `Show all ${filtered.length}`}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function PriceFilter({ presets, currencySymbol }: { presets: PricePreset[]; currencySymbol: string }) {
  const { searchParams, setPrice } = useFilterState();
  const raw = searchParams.get("price");
  const [min, setMin] = useState(raw?.split("-")[0] ?? "");
  const [max, setMax] = useState(raw?.split("-")[1] ?? "");

  // When the URL changes (preset click, back button, chip removal) the inputs
  // follow it. Derived during render, not synced by an effect.
  const [prevRaw, setPrevRaw] = useState(raw);
  if (raw !== prevRaw) {
    setPrevRaw(raw);
    setMin(raw?.split("-")[0] ?? "");
    setMax(raw?.split("-")[1] ?? "");
  }

  return (
    <section className="py-4">
      <p className="mb-2 text-small font-semibold text-foreground">Price</p>
      <ul className="mb-3 space-y-1">
        {presets.map((preset) => {
          const active = raw === `${preset.min ?? 0}-${preset.max ?? ""}`;
          return (
            <li key={preset.label}>
              <button
                onClick={() => (active ? setPrice() : setPrice(preset.min, preset.max))}
                className={`text-small ${active ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                {preset.label.replace(/(\d[\d,]*)/g, (m) => `${currencySymbol}${Number(m).toLocaleString()}`)}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-1">
        <input
          inputMode="numeric"
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
          placeholder="Min"
          aria-label="Minimum price"
          className="h-9 w-full min-w-0 rounded-md border border-border px-2 text-small"
        />
        <span className="text-subtle-foreground">–</span>
        <input
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
          placeholder="Max"
          aria-label="Maximum price"
          className="h-9 w-full min-w-0 rounded-md border border-border px-2 text-small"
        />
        <button
          onClick={() => setPrice(min ? Number(min) : undefined, max ? Number(max) : undefined)}
          className="h-9 shrink-0 rounded-md border border-border px-2 text-small font-medium text-foreground"
        >
          Go
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ chips */

export function FilterChipRow({ facets }: { facets: FacetGroup[] }) {
  const { searchParams, toggle, setPrice, clearAll } = useFilterState();

  const chips = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = [];
    for (const facet of facets) {
      const values = (searchParams.get(facet.key) ?? "").split(",").filter(Boolean);
      for (const value of values) {
        out.push({
          key: `${facet.key}:${value}`,
          label: optionLabel(facet.key, value),
          onRemove: () => toggle(facet.key, value),
        });
      }
    }
    const price = searchParams.get("price");
    if (price) {
      const [min, max] = price.split("-");
      out.unshift({
        key: "price",
        label: max ? `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}` : `Over ${Number(min).toLocaleString()}`,
        onRemove: () => setPrice(),
      });
    }
    return out;
  }, [facets, searchParams, toggle, setPrice]);

  if (!chips.length) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-small text-primary"
        >
          {chip.label}
          <X size={13} />
        </button>
      ))}
      <button onClick={clearAll} className="text-small font-medium text-muted-foreground hover:text-primary hover:underline">
        Clear all
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------- sort */

export function SortSelect({ value }: { value: SortKey }) {
  const { setSort } = useFilterState();
  return (
    <label className="flex items-center gap-2 text-small text-muted-foreground">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={value}
        onChange={(e) => setSort(e.target.value as SortKey)}
        className="h-10 rounded-md border border-border bg-card px-2 text-small text-foreground"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------- mobile filter sheet */

export function MobileFilterSheet({
  facets,
  pricePresets,
  currencySymbol,
  resultCount,
}: {
  facets: FacetGroup[];
  pricePresets: PricePreset[];
  currencySymbol: string;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const { pending } = useFilterState();

  // The Radix sheet supplies focus trapping, scroll locking and Escape.
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="tap-target flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card text-small font-medium text-foreground lg:hidden">
        <SlidersHorizontal size={16} />
        Filter
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="inset-0 h-full max-w-none gap-0 border-0 bg-card p-0 lg:hidden"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle className="text-h2">Filters</SheetTitle>
          <SheetDescription className="sr-only">
            Narrow the results, then apply. Nothing changes until you apply.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <FilterGroups facets={facets} pricePresets={pricePresets} currencySymbol={currencySymbol} />
        </div>
        {/* Never apply-on-tap on mobile — each tap would cost a reload on a bad connection. */}
        <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setOpen(false)}
            className="tap-target w-full rounded-md bg-primary font-semibold text-primary-foreground"
          >
            {pending ? "Updating…" : `Apply (${resultCount.toLocaleString()} results)`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------- pagination */

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const { goToPage } = useFilterState();
  if (pageCount <= 1) return null;

  const pages = pageNumbers(page, pageCount);

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-1">
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page === 1}
        className="tap-target rounded-md border border-border px-3 text-small font-medium text-foreground disabled:text-subtle-foreground"
      >
        Previous
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-small text-subtle-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={`tap-target min-w-11 rounded-md border px-3 text-small font-medium ${
              p === page ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => goToPage(page + 1)}
        disabled={page === pageCount}
        className="tap-target rounded-md border border-border px-3 text-small font-medium text-foreground disabled:text-subtle-foreground"
      >
        Next
      </button>
    </nav>
  );
}

function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number) => out.push(n);
  push(1);
  if (page > 3) out.push("…");
  for (let n = Math.max(2, page - 1); n <= Math.min(pageCount - 1, page + 1); n++) push(n);
  if (page < pageCount - 2) out.push("…");
  if (pageCount > 1) push(pageCount);
  return out;
}

/** Grid dims while the next result set streams in, rather than blanking. */
export function ResultsShell({ children }: { children: React.ReactNode }) {
  const { pending } = useFilterState();
  return (
    <div
      aria-busy={pending}
      className={`transition-opacity duration-150 ${pending ? "opacity-60" : "opacity-100"}`}
    >
      {children}
    </div>
  );
}
