import type { Metadata } from "next";
import { dealProducts } from "@/lib/data/catalog";
import { parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";
import { CategoryTabs } from "@/components/merchandising/category-tabs";

export const metadata: Metadata = {
  title: "Deals — buy online in Nigeria | Finstore Market",
  description: "Live discounts from verified Nigerian merchants and platform campaigns.",
};

export default async function DealsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { locale } = await params;
  const resolved = await searchParams;
  const { config, deliverTo } = await getServerContext(locale);

  const pool = dealProducts();
  // Deals default to "ending soon" rather than relevance.
  const query = parseQuery(resolved, { perPage: 48, sort: "ending_soon" });
  const result = runQuery(query, { pool, destinationState: deliverTo.region });

  return (
    <PlpView
      result={result}
      pool={pool}
      locale={locale}
      config={config}
      destinationState={deliverTo.region}
      title="Deals"
      crumbs={[{ label: "Deals" }]}
      intro={<p className="mt-1 text-small text-muted-foreground">{pool.length.toLocaleString()} live deals right now</p>}
      headerExtra={<CategoryTabs basePath="/market/deals" locale={locale} activeSlug={query.category} useQueryParam />}
    />
  );
}
