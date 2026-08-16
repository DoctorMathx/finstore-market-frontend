import Link from "next/link";
import type { CountryConfig } from "@/lib/country";
import { CATALOG } from "@/lib/data/catalog";
import { toCardModels } from "@/lib/card";
import { DEPARTMENTS, visibleSubcategories } from "@/lib/taxonomy";
import { localePath } from "@/lib/locale";
import { ProductRail } from "@/components/product/product-grid";

/**
 * A dead end on search is a lost session. Show the query, offer a correction,
 * point at the nearest categories, and still put products on the page.
 */
export function SearchEmptyState({
  query,
  locale,
  config,
  destinationState,
}: {
  query: string;
  locale: string;
  config: CountryConfig;
  destinationState: string;
}) {
  const suggestion = nearestTerm(query);
  const categories = nearestCategories(query);
  const popular = [...CATALOG].sort((a, b) => b.unitsSold7d - a.unitsSold7d).slice(0, 12);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card px-5 py-8">
        <h2 className="text-h2">
          No results for <span className="text-primary">“{query}”</span>
        </h2>
        {suggestion ? (
          <p className="mt-2 text-body text-muted-foreground">
            Did you mean{" "}
            <Link
              href={localePath(locale, `/market/search?q=${encodeURIComponent(suggestion)}`)}
              className="font-medium text-primary underline"
            >
              {suggestion}
            </Link>
            ?
          </p>
        ) : (
          <p className="mt-2 text-body text-muted-foreground">
            Check the spelling, use fewer words, or try a more general term.
          </p>
        )}

        {categories.length ? (
          <div className="mt-4">
            <p className="mb-2 text-small font-semibold text-foreground">Try these categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={localePath(locale, `/market/c/${category.slug}`)}
                  className="rounded-full border border-border bg-background-alt px-3 py-1.5 text-small text-foreground hover:border-primary hover:text-primary"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ProductRail
        cards={toCardModels(popular, { config, destinationState })}
        locale={locale}
        title="Popular on Finstore Market"
      />
    </div>
  );
}

/** Cheap edit-distance correction against titles we actually have. */
function nearestTerm(query: string): string | undefined {
  const term = query.toLowerCase().trim();
  if (term.length < 4) return undefined;
  let best: { word: string; distance: number } | undefined;
  const words = new Set<string>();
  for (const product of CATALOG.slice(0, 600)) {
    for (const word of product.title.toLowerCase().split(/\s+/)) {
      if (word.length >= 4) words.add(word);
    }
  }
  for (const word of words) {
    const distance = levenshtein(term, word);
    if (distance > 0 && distance <= 2 && (!best || distance < best.distance)) {
      best = { word, distance };
    }
  }
  return best?.word;
}

function nearestCategories(query: string) {
  const term = query.toLowerCase();
  const all = [...DEPARTMENTS, ...visibleSubcategories()];
  const scored = all
    .map((c) => ({ node: c, score: overlap(term, c.label.toLowerCase()) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => c.node);
  return scored.length ? scored : DEPARTMENTS.slice(0, 3);
}

function overlap(a: string, b: string): number {
  const at = new Set(a.split(/\s+/));
  return b.split(/\s+/).filter((w) => at.has(w)).length;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return matrix[a.length][b.length];
}
