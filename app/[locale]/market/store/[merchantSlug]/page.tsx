import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { MERCHANTS, merchantBySlug } from "@/lib/data/merchants";
import { productsByMerchant } from "@/lib/data/catalog";
import { parseQuery, runQuery, type SearchParamsInput } from "@/lib/plp";
import { getServerContext } from "@/lib/server-context";
import { PlpView } from "@/components/discovery/plp-view";
import { MerchantLogo, RatingStars } from "@/components/ui";

type Props = {
  params: Promise<{ locale: string; merchantSlug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export function generateStaticParams() {
  return MERCHANTS.map((m) => ({ merchantSlug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { merchantSlug } = await params;
  const merchant = merchantBySlug(merchantSlug);
  if (!merchant) return {};
  return {
    title: `${merchant.name} — store on Finstore Market`,
    description: `Buy from ${merchant.name}, ${merchant.originCity}. ${merchant.completedOrders.toLocaleString()} completed orders.`,
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { locale, merchantSlug } = await params;
  const merchant = merchantBySlug(merchantSlug);
  if (!merchant) notFound();

  const { config, deliverTo } = await getServerContext(locale);
  const pool = productsByMerchant(merchant.id);
  const query = parseQuery(await searchParams, { perPage: 48 });
  const result = runQuery(query, { pool, destinationState: deliverTo.region });

  return (
    <PlpView
      result={result}
      pool={pool}
      locale={locale}
      config={config}
      destinationState={deliverTo.region}
      title={merchant.name}
      crumbs={[{ label: "Stores" }, { label: merchant.name }]}
      headerExtra={
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
          <MerchantLogo seed={merchant.logoSeed} name={merchant.name} size={56} />
          <div>
            <p className="flex items-center gap-1.5 text-h2">
              {merchant.name}
              {merchant.verified ? <BadgeCheck size={18} className="text-primary" aria-label="Verified merchant" /> : null}
            </p>
            {merchant.rating !== undefined ? (
              <p className="flex items-center gap-1.5 text-small text-muted-foreground">
                <RatingStars value={merchant.rating} size={13} />
                {merchant.rating} · {merchant.completedOrders.toLocaleString()} completed orders · joined {merchant.joinedYear}
              </p>
            ) : (
              <p className="text-small text-muted-foreground">New merchant · joined {merchant.joinedYear}</p>
            )}
            <p className="text-small text-muted-foreground">
              Ships from {merchant.originCity}, {merchant.originState} · typically ships in{" "}
              {Math.max(1, Math.round(merchant.medianHandlingHours / 24))} day
              {Math.max(1, Math.round(merchant.medianHandlingHours / 24)) === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      }
    />
  );
}
