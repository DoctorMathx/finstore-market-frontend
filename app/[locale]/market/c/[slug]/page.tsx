import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEPARTMENTS, categoryPath, findCategory } from "@/lib/taxonomy";
import { productsInCategory } from "@/lib/data/catalog";
import { activeFilterCount, parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";
import { SubcategoryRow } from "@/components/product/product-grid";
import { JsonLd, breadcrumbLd } from "@/components/seo/json-ld";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export function generateStaticParams() {
  return DEPARTMENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const category = findCategory(slug);
  if (!category || category.hidden) return {};
  return {
    title: `${category.label} — buy online in Nigeria | Finstore Market`,
    description: `Shop ${category.label.toLowerCase()} from verified Nigerian merchants. Delivery dates before you pay, and stores are paid only after you confirm delivery.`,
    alternates: { canonical: `/${locale}/market/c/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const category = findCategory(slug);
  // Hidden categories exist in the tree but are not merchandised — a buyer
  // should get a 404, not an empty grid that looks like a broken filter.
  if (!category || category.hidden) notFound();

  const resolved = await searchParams;
  const { config, deliverTo } = await getServerContext(locale);

  const pool = productsInCategory(slug);
  const query = parseQuery(resolved, { category: slug, perPage: 48 });
  const result = runQuery(query, { pool, destinationState: deliverTo.region });

  const path = categoryPath(slug);
  const crumbs = path.map((node) => ({ label: node.label, href: `/market/c/${node.slug}` }));

  // Filtered PLPs canonical back to the unfiltered category; more than two
  // active filters is noindex.
  const filters = activeFilterCount(query);

  // Hidden subcategories are not offered as navigation.
  const children = (category.children ?? [])
    .filter((child) => !child.hidden)
    .map((child) => ({ slug: child.slug, label: child.label, productCount: child.productCount }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs, locale),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: category.label,
            numberOfItems: result.total,
            itemListElement: result.items.slice(0, 20).map((product, index) => ({
              "@type": "ListItem",
              position: (result.page - 1) * query.perPage + index + 1,
              name: product.title,
            })),
          },
        ]}
      />
      {filters > 2 ? <meta name="robots" content="noindex,follow" /> : null}

      <PlpView
        result={result}
        pool={pool}
        locale={locale}
        config={config}
        destinationState={deliverTo.region}
        title={category.label}
        crumbs={crumbs}
        intro={
          <p className="mt-1 max-w-2xl text-small text-muted-foreground">
            {pool.length.toLocaleString()} listings from verified merchants. Delivery estimates are for{" "}
            {deliverTo.subRegion}, {deliverTo.region}.
          </p>
        }
        headerExtra={
          children.length && category.level === 1 ? (
            <SubcategoryRow categories={children} locale={locale} />
          ) : null
        }
      />
    </>
  );
}
