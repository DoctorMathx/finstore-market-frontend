import Link from "next/link";
import type { CountryConfig } from "@/lib/country";
import { toCardModels } from "@/lib/card";
import { pricePresets, type PlpResult } from "@/lib/plp";
import { localePath } from "@/lib/locale";
import { CATALOG } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState, PageContainer } from "@/components/ui";
import { Breadcrumb, type Crumb } from "@/components/layout/breadcrumb";
import {
  FilterChipRow,
  FilterRail,
  MobileFilterSheet,
  Pagination,
  ResultsShell,
  SortSelect,
} from "./filters";
import { SearchEmptyState } from "./search-empty-state";
import type { Product } from "@/lib/types";

/**
 * One layout for category and search. Search results differ only by carrying a
 * query term and a "results for" header.
 */
export function PlpView({
  result,
  pool,
  locale,
  config,
  destinationState,
  title,
  crumbs,
  intro,
  ranked = false,
  headerExtra,
}: {
  result: PlpResult;
  pool: Product[];
  locale: string;
  config: CountryConfig;
  destinationState: string;
  title: string;
  crumbs: Crumb[];
  intro?: React.ReactNode;
  ranked?: boolean;
  headerExtra?: React.ReactNode;
}) {
  const cards = toCardModels(result.items, { config, destinationState });
  const presets = pricePresets(pool.length ? pool : CATALOG);

  return (
    <PageContainer className="py-4 lg:py-6">
      <Breadcrumb crumbs={crumbs} locale={locale} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display">{title}</h1>
          {intro}
        </div>
        <div className="hidden items-center gap-4 lg:flex">
          <p className="text-small text-muted-foreground">{result.total.toLocaleString()} products</p>
          <SortSelect value={result.query.sort} />
        </div>
      </div>

      {headerExtra}

      {/* Sticky filter/sort bar on mobile */}
      <div className="sticky top-[var(--header-h,0px)] z-30 -mx-4 mb-3 flex gap-2 border-y border-border bg-card px-4 py-2 lg:hidden">
        <MobileFilterSheet
          facets={result.facets}
          pricePresets={presets}
          currencySymbol={config.currency.symbol}
          resultCount={result.total}
        />
        <div className="flex-1">
          <SortSelect value={result.query.sort} />
        </div>
      </div>

      <div className="flex gap-8 lg:gap-10">
        <FilterRail facets={result.facets} pricePresets={presets} currencySymbol={config.currency.symbol} />

        <div className="min-w-0 flex-1">
          <FilterChipRow facets={result.facets} />
          <p className="mb-2 text-small text-muted-foreground lg:hidden">{result.total.toLocaleString()} products</p>

          <ResultsShell>
            {cards.length ? (
              <>
                <ProductGrid cards={cards} locale={locale} ranked={ranked} />
                <Pagination page={result.page} pageCount={result.pageCount} />
              </>
            ) : result.query.q ? (
              <SearchEmptyState query={result.query.q} locale={locale} config={config} destinationState={destinationState} />
            ) : (
              <EmptyState
                title="Nothing matches those filters"
                body="Try removing a filter, or widen your price range. Every option showing a zero is disabled rather than hidden, so you can see what is available."
                action={
                  <Link
                    href={localePath(locale, "/market")}
                    className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
                  >
                    Browse categories
                  </Link>
                }
              />
            )}
          </ResultsShell>
        </div>
      </div>
    </PageContainer>
  );
}
