import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Flag } from "lucide-react";
import {
  moreFromMerchant,
  productByRouteParam,
  productHref,
  relatedProducts,
  reviewsFor,
} from "@/lib/data/catalog";
import { toCardModels } from "@/lib/card";
import { toPdpModel } from "@/lib/pdp";
import { estimateArrival, formatDeliveryDate } from "@/lib/delivery";
import { formatMoney } from "@/lib/money";
import { localePath } from "@/lib/locale";
import { getServerContext } from "@/lib/server-context";
import { PageContainer, RatingStars } from "@/components/ui";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { JsonLd, breadcrumbLd } from "@/components/seo/json-ld";
import { ImageGallery } from "@/components/product/image-gallery";
import { BuyBox } from "@/components/product/buy-box";
import { MerchantCard } from "@/components/product/merchant-card";
import { Collapsible, RichTextDescription } from "@/components/product/description";
import { ReviewSection } from "@/components/product/reviews";
import { ProductRail } from "@/components/product/product-grid";
import { ViewTracker } from "@/components/product/view-tracker";

type Props = { params: Promise<{ locale: string; param: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { param, locale } = await params;
  const product = productByRouteParam(param);
  if (!product) return {};
  return {
    title: `${product.title} — buy online in Nigeria | Finstore Market`,
    description: `${product.title} from ${product.merchant.name}, ${product.merchant.originCity}. Delivery date shown before you pay. The store is paid only after you confirm delivery.`,
    // Canonical to itself regardless of which category path the buyer arrived from.
    alternates: { canonical: `/${locale}${productHref(product)}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, param } = await params;
  const product = productByRouteParam(param);
  if (!product) notFound();

  const { config, deliverTo } = await getServerContext(locale);
  const model = toPdpModel(product, config);
  const quote = estimateArrival(product.merchant, deliverTo.region, product.packClass);
  const reviews = reviewsFor(product);

  const crumbs = product.categoryPath.map((node) => ({ label: node.label, href: `/market/c/${node.slug}` }));
  const cardOptions = { config, destinationState: deliverTo.region };

  return (
    <PageContainer className="py-4 lg:py-6">
      <ViewTracker productId={product.id} />
      <JsonLd
        data={[
          breadcrumbLd([...crumbs, { label: product.title }], locale),
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            brand: product.brand,
            description: product.title,
            sku: product.variants[0]?.sku,
            offers: {
              "@type": "Offer",
              price: (product.price.amount / 100).toFixed(2),
              priceCurrency: product.price.currency,
              availability:
                product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: product.merchant.name },
            },
            ...(product.rating
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: product.rating.average,
                    reviewCount: product.rating.count,
                  },
                }
              : {}),
          },
        ]}
      />

      <Breadcrumb crumbs={[...crumbs, { label: product.title }]} locale={locale} />

      <div className="grid gap-8 lg:grid-cols-[40fr_35fr_25fr] lg:gap-10">
        <div className="lg:sticky lg:top-[calc(var(--header-h,0px)+1.5rem)] lg:self-start">
          <ImageGallery images={product.images.map((i) => ({ seed: i.seed, alt: i.alt }))} title={product.title} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-h1 lg:text-display">{product.title}</h1>
            {product.rating ? (
              <a href="#reviews" className="mt-1 flex items-center gap-2 text-small text-muted-foreground hover:text-primary">
                <RatingStars value={product.rating.average} />
                {product.rating.average} · {product.rating.count.toLocaleString()} reviews
              </a>
            ) : null}
            {product.condition !== "new" ? (
              <p className="mt-1 text-small font-medium text-warning">
                Condition: {product.condition === "used" ? "Used" : "Refurbished"}
              </p>
            ) : null}
          </div>

          <MerchantCard merchant={product.merchant} locale={locale} compact />

          {/* Buy box comes before the detail on mobile; on desktop it is column 3. */}
          <div className="lg:hidden">
            <BuyBox
              model={model}
              locale={locale}
              deliveryCostMinor={quote.cost.amount}
              arrivesLabel={formatDeliveryDate(quote.estimatedDate)}
            />
          </div>

          <div>
            <h2 className="mb-2 text-h2">Key details</h2>
            <ul className="list-disc space-y-1 pl-5 text-body text-muted-foreground">
              {product.keyDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-[calc(var(--header-h,0px)+1.5rem)] lg:block lg:self-start">
          <BuyBox
            model={model}
            locale={locale}
            deliveryCostMinor={quote.cost.amount}
            arrivesLabel={formatDeliveryDate(quote.estimatedDate)}
          />
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-12">
        <section>
          <h2 className="mb-2 text-h2">Description</h2>
          <RichTextDescription html={product.description} />
        </section>

        {/* An empty specification table is never rendered. */}
        {product.specs.length ? (
          <Collapsible title="Specifications" defaultOpen>
            <table className="w-full text-body">
              <tbody>
                {product.specs.map((spec, index) => (
                  <tr key={spec.label} className={index % 2 ? "bg-background-alt" : ""}>
                    <th scope="row" className="w-40 px-3 py-2 text-left font-medium text-foreground">
                      {spec.label}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Collapsible>
        ) : null}

        <ProductRail
          cards={toCardModels(moreFromMerchant(product), cardOptions)}
          locale={locale}
          title={`More from ${product.merchant.name}`}
          href={`/market/store/${product.merchant.slug}`}
          linkLabel="Visit store"
        />

        <ProductRail
          cards={toCardModels(relatedProducts(product), cardOptions)}
          locale={locale}
          title="Similar products"
          href={`/market/c/${product.categorySlug}`}
        />

        <section id="reviews" className="scroll-mt-[calc(var(--header-h,0px)+1rem)]">
          <h2 className="mb-3 text-h2">Reviews</h2>
          <ReviewSection
            reviews={reviews}
            average={product.rating?.average}
            count={product.rating?.count ?? 0}
            histogram={product.rating?.histogram}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-small text-muted-foreground">
            Sold by {product.merchant.name} · Price shown is{" "}
            {formatMoney(product.price, config)} including VAT where applicable. Delivery is charged separately.
          </p>
          <Link
            href={localePath(locale, `/market/help/report?product=${product.id}`)}
            className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-destructive"
          >
            <Flag size={14} /> Report this listing
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
