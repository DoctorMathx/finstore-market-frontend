import { CATALOG, brandsIn, productsInCategory, statesIn, variantValuesIn } from "./data/catalog";
import { estimateArrival, speedBucket } from "./delivery";
import { discountPercent } from "./money";
import { facetsFor, type FacetKey } from "./taxonomy";
import type { Product } from "./types";

/**
 * Filters are URL state: shareable, back-button correct, server-renderable.
 * This module is the single place that reads them.
 */

export type SortKey = "relevance" | "price_asc" | "price_desc" | "newest" | "rating" | "best_selling" | "ending_soon";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "newest", label: "Newest" },
  { key: "rating", label: "Best rated" },
  { key: "best_selling", label: "Best selling" },
];

export type PlpQuery = {
  q?: string;
  category?: string;
  brand: string[];
  condition?: "new" | "refurbished" | "used";
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  shipsFrom: string[];
  delivery?: "next-day" | "2-3-days";
  discount?: number;
  /** category-specific facets from facetSchema, e.g. size / colour / storage */
  attributes: Record<string, string[]>;
  sort: SortKey;
  page: number;
  perPage: number;
};

const ATTRIBUTE_FACETS: FacetKey[] = ["size", "colour", "storage", "capacity", "weight"];

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined): string[] {
  const raw = first(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

export function parseQuery(params: SearchParamsInput, defaults: Partial<PlpQuery> = {}): PlpQuery {
  const attributes: Record<string, string[]> = {};
  for (const facet of ATTRIBUTE_FACETS) {
    const values = list(params[facet]);
    if (values.length) attributes[facet] = values;
  }
  const priceRaw = first(params.price);
  const [minRaw, maxRaw] = priceRaw ? priceRaw.split("-") : [];

  return {
    q: first(params.q)?.trim() || undefined,
    category: first(params.cat) ?? defaults.category,
    brand: list(params.brand),
    condition: first(params.condition) as PlpQuery["condition"],
    priceMin: minRaw ? Number(minRaw) : undefined,
    priceMax: maxRaw ? Number(maxRaw) : undefined,
    rating: first(params.rating) ? Number(first(params.rating)) : undefined,
    shipsFrom: list(params.shipsFrom),
    delivery: first(params.delivery) as PlpQuery["delivery"],
    discount: first(params.discount) ? Number(first(params.discount)) : undefined,
    attributes,
    sort: (first(params.sort) as SortKey) ?? defaults.sort ?? "relevance",
    page: Math.max(1, Number(first(params.page) ?? 1)),
    perPage: defaults.perPage ?? 48,
  };
}

/** Serialise back to a query string, dropping defaults so URLs stay clean. */
export function buildQueryString(query: Partial<PlpQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("cat", query.category);
  if (query.brand?.length) params.set("brand", query.brand.join(","));
  if (query.condition) params.set("condition", query.condition);
  if (query.priceMin != null || query.priceMax != null) {
    params.set("price", `${query.priceMin ?? 0}-${query.priceMax ?? ""}`);
  }
  if (query.rating) params.set("rating", String(query.rating));
  if (query.shipsFrom?.length) params.set("shipsFrom", query.shipsFrom.join(","));
  if (query.delivery) params.set("delivery", query.delivery);
  if (query.discount) params.set("discount", String(query.discount));
  for (const [key, values] of Object.entries(query.attributes ?? {})) {
    if (values.length) params.set(key, values.join(","));
  }
  if (query.sort && query.sort !== "relevance") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  return params.toString();
}

/** How many facets the buyer has actually narrowed by — drives the noindex rule. */
export function activeFilterCount(query: PlpQuery): number {
  return (
    (query.brand.length ? 1 : 0) +
    (query.condition ? 1 : 0) +
    (query.priceMin != null || query.priceMax != null ? 1 : 0) +
    (query.rating ? 1 : 0) +
    (query.shipsFrom.length ? 1 : 0) +
    (query.delivery ? 1 : 0) +
    (query.discount ? 1 : 0) +
    Object.keys(query.attributes).length
  );
}

function matchesText(product: Product, q: string): boolean {
  const haystack = `${product.title} ${product.brand ?? ""} ${product.categoryPath.map((c) => c.label).join(" ")} ${product.merchant.name}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

type Predicate = (p: Product) => boolean;

function predicates(query: PlpQuery, destinationState: string): Record<string, Predicate> {
  return {
    brand: (p) => !query.brand.length || (p.brand ? query.brand.includes(p.brand) : false),
    condition: (p) => !query.condition || p.condition === query.condition,
    price: (p) => {
      const major = p.price.amount / 100;
      if (query.priceMin != null && major < query.priceMin) return false;
      if (query.priceMax != null && query.priceMax > 0 && major > query.priceMax) return false;
      return true;
    },
    rating: (p) => !query.rating || (p.rating?.average ?? 0) >= query.rating,
    shipsFrom: (p) => !query.shipsFrom.length || query.shipsFrom.includes(p.merchant.originState),
    delivery: (p) => {
      if (!query.delivery) return true;
      const quote = estimateArrival(p.merchant, destinationState, p.packClass);
      const bucket = speedBucket(quote.estimatedDate);
      return query.delivery === "next-day" ? bucket === "next-day" : bucket !== "slower";
    },
    discount: (p) => {
      if (!query.discount) return true;
      const pct = discountPercent(p.price, p.originalPrice);
      return pct != null && pct >= query.discount;
    },
    attributes: (p) =>
      Object.entries(query.attributes).every(([axis, values]) =>
        p.variants.some((v) => values.includes(v.attributes[axis])),
      ),
  };
}

function applyAllExcept(products: Product[], query: PlpQuery, destinationState: string, skip?: string): Product[] {
  const preds = predicates(query, destinationState);
  const active = Object.entries(preds).filter(([key]) => key !== skip);
  return products.filter((p) => active.every(([, fn]) => fn(p)));
}

function sortProducts(products: Product[], sort: SortKey, q?: string): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price.amount - b.price.amount);
    case "price_desc":
      return sorted.sort((a, b) => b.price.amount - a.price.amount);
    case "newest":
      return sorted.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
    case "rating":
      return sorted.sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
    case "best_selling":
      return sorted.sort((a, b) => b.unitsSold7d - a.unitsSold7d);
    case "ending_soon":
      return sorted.sort((a, b) => {
        const ax = a.deal?.endsAt ? Date.parse(a.deal.endsAt) : Number.MAX_SAFE_INTEGER;
        const bx = b.deal?.endsAt ? Date.parse(b.deal.endsAt) : Number.MAX_SAFE_INTEGER;
        return ax - bx;
      });
    default:
      return sorted.sort((a, b) => relevance(b, q) - relevance(a, q));
  }
}

function relevance(p: Product, q?: string): number {
  let score = p.unitsSold7d + (p.rating?.count ?? 0) / 10 + (p.rating?.average ?? 0) * 20;
  if (p.totalStock === 0) score -= 500; // out of stock never leads a page
  if (q && p.title.toLowerCase().startsWith(q.toLowerCase())) score += 400;
  return score;
}

export type FacetOption = { value: string; count: number; disabled: boolean };

export type PlpResult = {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  facets: {
    key: FacetKey;
    options: FacetOption[];
  }[];
  query: PlpQuery;
};

export function runQuery(
  query: PlpQuery,
  options: { pool?: Product[]; destinationState?: string } = {},
): PlpResult {
  const destinationState = options.destinationState ?? "Lagos";
  let pool = options.pool ?? (query.category ? productsInCategory(query.category) : CATALOG);
  if (query.q) pool = pool.filter((p) => matchesText(p, query.q!));

  const matched = applyAllExcept(pool, query, destinationState);
  const sorted = sortProducts(matched, query.sort, query.q);

  const pageCount = Math.max(1, Math.ceil(sorted.length / query.perPage));
  const page = Math.min(query.page, pageCount);
  const items = sorted.slice((page - 1) * query.perPage, page * query.perPage);

  // Facet counts reflect every *other* active filter, so counts stay truthful
  // and zero-count options can be disabled rather than hidden.
  const schema = facetsFor(query.category ?? "");
  const facets = schema
    .map((key) => ({ key, options: facetOptions(key, pool, query, destinationState) }))
    .filter((f) => f.options.length > 0 || f.key === "price");

  return { items, total: sorted.length, page, pageCount, facets, query };
}

function facetOptions(
  key: FacetKey,
  pool: Product[],
  query: PlpQuery,
  destinationState: string,
): FacetOption[] {
  const others = applyAllExcept(pool, query, destinationState, facetPredicateKey(key));
  const count = (values: { value: string; count: number }[]) =>
    values.map((v) => ({ ...v, disabled: v.count === 0 }));

  switch (key) {
    case "brand":
      return count(brandsIn(others)).slice(0, 40);
    case "shipsFrom":
      return count(statesIn(others)).slice(0, 24);
    case "condition":
      return count(
        (["new", "refurbished", "used"] as const).map((value) => ({
          value,
          count: others.filter((p) => p.condition === value).length,
        })),
      );
    case "rating":
      return count(
        [4, 3].map((min) => ({
          value: String(min),
          count: others.filter((p) => (p.rating?.average ?? 0) >= min).length,
        })),
      );
    case "delivery":
      return count(
        [
          { value: "next-day", label: "next-day" },
          { value: "2-3-days", label: "2-3-days" },
        ].map(({ value }) => ({
          value,
          count: others.filter((p) => {
            const bucket = speedBucket(estimateArrival(p.merchant, destinationState, p.packClass).estimatedDate);
            return value === "next-day" ? bucket === "next-day" : bucket !== "slower";
          }).length,
        })),
      );
    case "discount":
      return count(
        [10, 25, 50].map((min) => ({
          value: String(min),
          count: others.filter((p) => {
            const pct = discountPercent(p.price, p.originalPrice);
            return pct != null && pct >= min;
          }).length,
        })),
      );
    case "price":
      return [];
    default:
      return count(variantValuesIn(others, key)).slice(0, 20);
  }
}

function facetPredicateKey(key: FacetKey): string {
  if (ATTRIBUTE_FACETS.includes(key)) return "attributes";
  return key;
}

/** Preset price bands, scaled to what the category actually costs. */
export function pricePresets(products: Product[]): { label: string; min?: number; max?: number }[] {
  if (!products.length) return [];
  const prices = products.map((p) => p.price.amount / 100).sort((a, b) => a - b);
  const q = (fraction: number) => prices[Math.floor(prices.length * fraction)];
  const round = (n: number) => {
    const magnitude = 10 ** Math.max(2, Math.floor(Math.log10(n)) - 1);
    return Math.round(n / magnitude) * magnitude;
  };
  const b1 = round(q(0.25));
  const b2 = round(q(0.5));
  const b3 = round(q(0.75));
  return [
    { label: `Under ${b1}`, max: b1 },
    { label: `${b1} – ${b2}`, min: b1, max: b2 },
    { label: `${b2} – ${b3}`, min: b2, max: b3 },
    { label: `Over ${b3}`, min: b3 },
  ];
}
