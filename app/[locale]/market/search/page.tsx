import type { Metadata } from "next";
import { CATALOG } from "@/lib/data/catalog";
import { findCategory } from "@/lib/taxonomy";
import { parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const term = Array.isArray(q) ? q[0] : q;
  return {
    title: term ? `${term} — Finstore Market` : "Search — Finstore Market",
    // Search result pages are never indexed; the category tree is the SEO surface.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolved = await searchParams;
  const { config, deliverTo } = await getServerContext(locale);

  const query = parseQuery(resolved, { perPage: 48 });
  const scope = query.category ? findCategory(query.category) : undefined;
  const pool = CATALOG;
  const result = runQuery(query, { destinationState: deliverTo.region });

  const title = query.q ? `Results for “${query.q}”` : "All products";

  return (
    <PlpView
      result={result}
      pool={pool}
      locale={locale}
      config={config}
      destinationState={deliverTo.region}
      title={title}
      crumbs={[{ label: query.q ? `Search: ${query.q}` : "Search" }]}
      intro={
        <p className="mt-1 text-small text-muted-foreground">
          {result.total.toLocaleString()} products
          {scope ? ` in ${scope.label}` : ""} · Delivery estimates for {deliverTo.subRegion}, {deliverTo.region}
        </p>
      }
    />
  );
}
