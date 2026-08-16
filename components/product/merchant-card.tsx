import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { MerchantSummary } from "@/lib/types";
import { localePath } from "@/lib/locale";
import { MerchantLogo, RatingStars } from "@/components/ui";

/**
 * Non-negotiable on a marketplace — buyers need to know who they are actually
 * buying from. A rating is withheld below 10 rated orders: a 5.0 from one
 * review is misleading and a 1.0 from one review is unfair.
 */
export function MerchantCard({
  merchant,
  locale,
  compact = false,
}: {
  merchant: MerchantSummary;
  locale: string;
  compact?: boolean;
}) {
  const days = Math.max(1, Math.round(merchant.medianHandlingHours / 24));
  const handling = `Typically ships in ${days} day${days === 1 ? "" : "s"}`;

  return (
    <div className={`rounded-lg border border-border bg-card ${compact ? "p-3" : "p-4"}`}>
      <div className="flex gap-3">
        <MerchantLogo seed={merchant.logoSeed} name={merchant.name} size={compact ? 36 : 48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-body font-semibold text-foreground">
            <span className="truncate">{merchant.name}</span>
            {merchant.verified ? <BadgeCheck size={16} className="shrink-0 text-primary" aria-label="Verified merchant" /> : null}
          </p>

          {merchant.rating !== undefined ? (
            <p className="flex items-center gap-1.5 text-small text-muted-foreground">
              <RatingStars value={merchant.rating} size={12} />
              {merchant.rating} · {merchant.completedOrders.toLocaleString()} orders
            </p>
          ) : (
            <p className="text-small text-muted-foreground">New merchant · {merchant.completedOrders} orders so far</p>
          )}

          <p className="text-small text-muted-foreground">
            Ships from {merchant.originCity}, {merchant.originState}
          </p>
          <p className="text-small text-muted-foreground">{handling}</p>

          <Link
            href={localePath(locale, `/market/store/${merchant.slug}`)}
            className="mt-2 inline-flex items-center rounded-md border border-border px-3 py-1.5 text-small font-medium text-foreground hover:border-primary hover:text-primary"
          >
            Visit store
          </Link>
        </div>
      </div>
    </div>
  );
}
