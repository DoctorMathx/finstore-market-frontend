import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Store, Truck } from "lucide-react";
import { CATALOG, dealProducts, newArrivals, productHref } from "@/lib/data/catalog";
import { isEstablished } from "@/lib/data/merchants";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { toCardModels } from "@/lib/card";
import { discountPercent, naira } from "@/lib/money";
import { localePath } from "@/lib/locale";
import { getServerContext } from "@/lib/server-context";
import { PageContainer } from "@/components/ui";
import {
  HeroCardRail,
  type HeroCard,
  type HeroCardProduct,
} from "@/components/merchandising/hero-card-rail";
import { ProductRail } from "@/components/product/product-grid";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";

export const metadata: Metadata = {
  title: "Finstore Market — buy from verified Nigerian merchants",
  description:
    "Phones, fashion, groceries and more from verified merchants across Nigeria. Stores are paid only after you confirm delivery.",
};

import type { Product } from "@/lib/types";

function toHeroProducts(products: Product[]): HeroCardProduct[] {
  return products.slice(0, 4).map((p) => {
    const pct = discountPercent(p.price, p.originalPrice);
    return {
      href: productHref(p),
      imageSeed: p.images[0].seed,
      title: p.title,
      // A "-1%" pill reads as a joke — single digits stay off the hero.
      discountPercent: pct != null && pct >= 10 ? pct : undefined,
    };
  });
}

/** Every card is backed by live catalog data — no tile is ever an empty promise. */
function buildHeroCards(destinationState: string): HeroCard[] {
  const inStock = (p: Product) => p.totalStock > 0;

  // The campaign card: phones and laptops under ₦400,000 from proven merchants.
  const backToSchool = CATALOG.filter(
    (p) =>
      inStock(p) &&
      p.categoryPath[0]?.slug === "phones-electronics" &&
      ["phones", "laptops-computing"].includes(p.categorySlug) &&
      p.price.amount <= naira(400_000).amount &&
      p.merchant.completedOrders >= 1000,
  ).sort((a, b) => b.unitsSold7d - a.unitsSold7d);

  const deals = dealProducts().filter(inStock);
  const endingSoon = deals.filter((p) => p.deal?.endsAt);
  const popular = [...deals].sort(
    (a, b) => (discountPercent(b.price, b.originalPrice) ?? 0) - (discountPercent(a.price, a.originalPrice) ?? 0),
  );
  const fresh = newArrivals().filter((p) => inStock(p) && isEstablished(p.merchant));
  const local = CATALOG.filter((p) => inStock(p) && p.merchant.originState === destinationState);

  const cards: HeroCard[] = [
    {
      eyebrow: "Back to school",
      title: "Phones and laptops under ₦400,000",
      body: "Refurbished and new, from merchants with over 1,000 completed orders.",
      ctaLabel: "Shop phones & electronics",
      href: "/market/c/phones-electronics",
      tint: "sky",
      products: toHeroProducts(backToSchool),
    },
    {
      title: "Deals ending soon",
      ctaLabel: "Shop all deals",
      href: "/market/deals",
      tint: "orange",
      products: toHeroProducts(endingSoon),
    },
    {
      title: "Popular deals",
      body: "The biggest live discounts right now.",
      ctaLabel: "See what's moving",
      href: "/market/deals",
      tint: "rose",
      products: toHeroProducts(popular),
    },
    {
      eyebrow: "Fresh finds",
      title: "New this month",
      ctaLabel: "Shop new arrivals",
      href: "/market/new-arrivals",
      tint: "emerald",
      products: toHeroProducts(fresh),
    },
    {
      title: `Ships from ${destinationState}`,
      body: "Closest merchants to you — usually the fastest delivery.",
      ctaLabel: "Shop nearby",
      href: `/market/search?shipsFrom=${encodeURIComponent(destinationState)}`,
      tint: "slate",
      products: toHeroProducts(local),
    },
    {
      eyebrow: "New to Finstore Market?",
      title: "The store is paid only after you confirm delivery",
      body: "Your money is held safely while your order travels. Check the item, confirm receipt, and only then is the merchant paid.",
      ctaLabel: "How it works",
      href: "/market/help/how-it-works",
      tint: "orange",
    },
  ];

  // A card with fewer than four real products would ship an empty promise.
  return cards.filter((card) => !card.products || card.products.length === 4);
}

export default async function MarketHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { config, deliverTo } = await getServerContext(locale);
  const cardOptions = { config, destinationState: deliverTo.region };

  // "Delivering to you" — merchants in the buyer's own state ship fastest and
  // convert best, so this rail leads the page below the tiles.
  const local = CATALOG.filter((p) => p.merchant.originState === deliverTo.region && p.totalStock > 0).slice(0, 12);
  const deals = dealProducts().slice(0, 12);

  const railCategories = DEPARTMENTS.slice(0, 4);

  return (
    <PageContainer className="flex flex-col gap-14 py-6 lg:gap-16 lg:py-8">
      <HeroCardRail cards={buildHeroCards(deliverTo.region)} locale={locale} />

      {local.length ? (
        <ProductRail
          cards={toCardModels(local, cardOptions)}
          locale={locale}
          title={`Ships from ${deliverTo.region}`}
          subtitle="Closest merchants to you — usually the fastest delivery"
          href={`/market/search?shipsFrom=${encodeURIComponent(deliverTo.region)}`}
        />
      ) : null}

      <ProductRail
        cards={toCardModels(deals, cardOptions)}
        locale={locale}
        title="Deals"
        subtitle="Live discounts from merchants and platform campaigns"
        href="/market/deals"
      />

      <section className="grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
        <TrustColumn
          icon={<ShieldCheck size={22} className="text-primary" />}
          title="Pay safely"
          body="Your money is held until you confirm the item arrived. The store is paid after that."
        />
        <TrustColumn
          icon={<Store size={22} className="text-primary" />}
          title="Real merchants"
          body="Every store on Market is verified before it can list. You always see who you are buying from."
        />
        <TrustColumn
          icon={<Truck size={22} className="text-primary" />}
          title="Delivery nationwide"
          body="Track every order from pickup to your door, with a delivery date before you pay."
        />
      </section>

      {railCategories.map((category) => {
        const products = CATALOG.filter((p) => p.categoryPath[0]?.slug === category.slug && p.totalStock > 0)
          .sort((a, b) => b.unitsSold7d - a.unitsSold7d)
          .slice(0, 12);
        return (
          <ProductRail
            key={category.slug}
            cards={toCardModels(products, cardOptions)}
            locale={locale}
            title={`Popular in ${category.label}`}
            href={`/market/c/${category.slug}`}
          />
        );
      })}

      {/* Renders nothing at all when there is no history — never an empty shell. */}
      <RecentlyViewedRail locale={locale} />

      <section className="flex flex-col items-start gap-4 rounded-xl border border-primary/20 bg-primary-soft p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <h2 className="text-h2">Selling already? Put your store in front of buyers.</h2>
          <p className="mt-1 text-body text-muted-foreground">
            Open a free Finstore store, then apply to list on Market. No listing fees at launch.
          </p>
        </div>
        <Link
          href={localePath(locale, "/market/help/sell-on-finstore")}
          className="tap-target inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Sell on Finstore
        </Link>
      </section>
    </PageContainer>
  );
}

function TrustColumn({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft">{icon}</span>
      <div>
        <h3 className="text-body font-semibold">{title}</h3>
        <p className="text-small text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
