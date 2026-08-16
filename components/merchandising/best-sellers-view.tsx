import { bestSellers, completedOrdersInWindow } from "@/lib/data/catalog";
import { findCategory } from "@/lib/taxonomy";
import { parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";
import { CategoryTabs } from "./category-tabs";
import { InlineAlert } from "@/components/ui";

/** A "best seller" list of three items destroys credibility, so we suppress it. */
const MIN_COMPLETED_ORDERS = 50;

export async function BestSellersView({
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

  const completed = completedOrdersInWindow(categorySlug);
  const suppressed = completed < MIN_COMPLETED_ORDERS;

  const pool = suppressed ? [] : bestSellers(categorySlug);
  const query = parseQuery(searchParams, { perPage: 48, sort: "best_selling", category: categorySlug });
  const result = runQuery(query, { pool, destinationState: deliverTo.region });

  return (
    <PlpView
      result={result}
      pool={pool}
      locale={locale}
      config={config}
      destinationState={deliverTo.region}
      title={category ? `Best sellers in ${category.label}` : "Best sellers"}
      ranked={!suppressed}
      crumbs={[
        { label: "Best sellers", href: "/market/best-sellers" },
        ...(category ? [{ label: category.label }] : []),
      ]}
      intro={
        <p className="mt-1 text-small text-muted-foreground">
          Ranked by completed orders over the last 7 days — not orders placed, so cancellations do not count.
        </p>
      }
      headerExtra={
        <>
          <CategoryTabs basePath="/market/best-sellers" locale={locale} activeSlug={categorySlug} />
          {suppressed ? (
            <div className="mb-4">
              <InlineAlert tone="info">
                Not enough completed orders in this category yet to publish a ranking. Check back soon — or browse the
                category directly.
              </InlineAlert>
            </div>
          ) : null}
        </>
      }
    />
  );
}
