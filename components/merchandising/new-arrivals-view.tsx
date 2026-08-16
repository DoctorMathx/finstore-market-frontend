import { newArrivals } from "@/lib/data/catalog";
import { isEstablished } from "@/lib/data/merchants";
import { findCategory } from "@/lib/taxonomy";
import { parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";
import { CategoryTabs } from "./category-tabs";

export async function NewArrivalsView({
  locale,
  searchParams,
  categorySlug,
}: {
  locale: string;
  searchParams: SearchParamsInput;
  categorySlug?: string;
}) {
  const { config, deliverTo } = await getServerContext(locale);
  const category = categorySlug ? findCategory(categorySlug) : undefined;

  // New listings from new merchants are the highest-risk combination on the
  // platform, so they do not get a promoted surface.
  const pool = newArrivals(categorySlug).filter((p) => isEstablished(p.merchant));

  const query = parseQuery(searchParams, { perPage: 48, sort: "newest", category: categorySlug });
  const result = runQuery(query, { pool, destinationState: deliverTo.region });

  return (
    <PlpView
      result={result}
      pool={pool}
      locale={locale}
      config={config}
      destinationState={deliverTo.region}
      title={category ? `New in ${category.label}` : "New arrivals"}
      crumbs={[
        { label: "New arrivals", href: "/market/new-arrivals" },
        ...(category ? [{ label: category.label }] : []),
      ]}
      intro={
        <p className="mt-1 text-small text-muted-foreground">
          Listed in the last 30 days by merchants with an established track record.
        </p>
      }
      headerExtra={<CategoryTabs basePath="/market/new-arrivals" locale={locale} activeSlug={categorySlug} />}
    />
  );
}
