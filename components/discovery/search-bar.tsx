"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X } from "lucide-react";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { localePath } from "@/lib/locale";
import { ProductImage } from "@/components/ui";
import { createStorageStore, useStorageStore } from "@/lib/client-store";

type Suggestion = {
  completions: string[];
  categories: { slug: string; label: string; level: number }[];
  products: { id: string; title: string; href: string; imageSeed: string; price: string }[];
  total?: number;
};

const EMPTY: Suggestion = { completions: [], categories: [], products: [] };
const recentStore = createStorageStore<string[]>("fm_recent_searches", []);

/** Real popular queries, not a generic "Search products". */
const PLACEHOLDERS = [
  'Search "iPhone 13"',
  'Search "Ankara fabric"',
  'Search "50kg rice"',
  'Search "generator 2.5kva"',
  'Search "bone straight wig"',
  'Search "HP laptop"',
];

export function SearchBar({ locale, autoFocus = false }: { locale: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [scope, setScope] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggestion>(EMPTY);
  const recent = useStorageStore(recentStore);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Rotate the placeholder rather than shipping a generic one.
    const id = setInterval(() => {
      setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const term = value.trim();

  useEffect(() => {
    // Below the 2-character floor there is nothing to fetch; the rows memo
    // shows recent searches instead, so no state needs clearing here.
    if (term.length < 2) return;
    // Debounced at 250ms.
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({ q: term, locale });
        if (scope) params.set("cat", scope);
        const res = await fetch(`/api/suggest?${params}`, { signal: controller.signal });
        const json = (await res.json()) as Suggestion;
        setData(json);
      } catch {
        // An aborted or failed suggest never blocks submitting the query.
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [term, scope, locale]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const rows = useMemo(() => {
    if (term.length < 2) {
      return recent.map((entry) => ({ kind: "recent" as const, label: entry }));
    }
    return [
      ...data.completions.map((label) => ({ kind: "completion" as const, label })),
      ...data.categories.map((c) => ({ kind: "category" as const, label: c.label, slug: c.slug })),
      ...data.products.map((p) => ({ kind: "product" as const, label: p.title, product: p })),
    ];
  }, [term, recent, data]);

  function commit(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    recentStore.set((prev) => [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, 6));
    setOpen(false);
    const params = new URLSearchParams({ q: trimmed });
    if (scope) params.set("cat", scope);
    router.push(localePath(locale, `/market/search?${params}`));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (event.key === "Enter") {
      const row = rows[activeIndex];
      if (row?.kind === "product") {
        setOpen(false);
        router.push(localePath(locale, row.product.href));
      } else if (row && "label" in row && activeIndex >= 0) {
        commit(row.label);
      } else {
        commit(value);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          commit(value);
        }}
        className="flex h-11 w-full overflow-hidden rounded-md border-2 border-primary bg-chrome-raised"
      >
        <label className="sr-only" htmlFor="market-search-scope">
          Search category
        </label>
        <select
          id="market-search-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="hidden max-w-[160px] shrink-0 border-r border-chrome-border bg-chrome-raised px-2 text-small text-chrome-muted md:block"
        >
          <option value="">All categories</option>
          {DEPARTMENTS.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="market-search-input">
          Search Finstore Market
        </label>
        <input
          id="market-search-input"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="market-search-suggestions"
          className="min-w-0 flex-1 bg-transparent px-3 text-body text-chrome-foreground outline-none placeholder:text-chrome-muted"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue("")}
            className="px-2 text-chrome-muted hover:text-chrome-foreground"
          >
            <X size={16} />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Search"
          className="flex w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground hover:bg-primary-hover"
        >
          <Search size={18} />
        </button>
      </form>

      {open && rows.length > 0 ? (
        <div
          id="market-search-suggestions"
          role="listbox"
          className="chrome-surface absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-chrome-border bg-chrome-raised shadow-xl"
        >
          {rows.map((row, index) => {
            const active = index === activeIndex;
            const base = `flex w-full items-center gap-2 px-3 py-2.5 text-left text-body ${
              active ? "bg-primary-soft" : "hover:bg-chrome-hover"
            }`;
            if (row.kind === "product") {
              return (
                <button
                  key={row.product.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    router.push(localePath(locale, row.product.href));
                  }}
                  className={`${base} border-t border-chrome-border`}
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-chrome-border">
                    <ProductImage seed={row.product.imageSeed} alt="" label={row.product.title} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-chrome-foreground">{row.product.title}</span>
                  <span className="shrink-0 text-small font-semibold text-chrome-foreground">{row.product.price}</span>
                </button>
              );
            }
            if (row.kind === "category") {
              return (
                <button
                  key={`c-${row.slug}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    router.push(localePath(locale, `/market/c/${row.slug}`));
                  }}
                  className={base}
                >
                  <Search size={14} className="shrink-0 text-chrome-muted" />
                  <span className="text-chrome-muted">
                    in <span className="font-medium text-primary">{row.label}</span>
                  </span>
                </button>
              );
            }
            return (
              <button
                key={`${row.kind}-${row.label}`}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => commit(row.label)}
                className={base}
              >
                {row.kind === "recent" ? (
                  <Clock size={14} className="shrink-0 text-chrome-muted" />
                ) : (
                  <Search size={14} className="shrink-0 text-chrome-muted" />
                )}
                <span className="truncate text-chrome-foreground">{row.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
