"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { CardModel } from "@/lib/card";
import { localePath } from "@/lib/locale";
import { useCart, useSaved } from "@/components/providers";
import { DiscountBadge, ProductImage, RatingStars, Skeleton } from "@/components/ui";
import { DealCountdown } from "@/components/merchandising/deal-countdown";

/**
 * Fixed height per row — ragged card bottoms are the fastest way to make a grid
 * look amateur. The rating line's vertical space is reserved even when empty.
 */
export function ProductCard({
  card,
  locale,
  rank,
  priority = false,
}: {
  card: CardModel;
  locale: string;
  rank?: number;
  priority?: boolean;
}) {
  const { add } = useCart();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(card.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl surface-raised transition-colors hover:border-border-strong">
      <div className="relative">
        <Link href={localePath(locale, card.href)} className="block" tabIndex={-1} aria-hidden="true">
          <span className={`block aspect-square ${card.inStock ? "" : "opacity-60"}`}>
            <ProductImage
              seed={card.imageSeed}
              alt=""
              label={card.title}
              priority={priority}
              className="h-full w-full"
            />
          </span>
        </Link>

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {rank ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-foreground px-1.5 text-micro font-semibold text-background">
              #{rank}
            </span>
          ) : null}
          {card.discountPercent ? <DiscountBadge percent={card.discountPercent} /> : null}
        </div>

        <button
          onClick={() => toggle(card.id)}
          aria-label={saved ? `Remove ${card.title} from saved items` : `Save ${card.title}`}
          aria-pressed={saved}
          className="tap-target absolute right-1 top-1 flex items-center justify-center rounded-full bg-card/90 text-muted-foreground opacity-100 transition-opacity hover:text-primary lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"}  />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3">
        <Link
          href={localePath(locale, card.href)}
          className="line-clamp-2 min-h-10 text-small leading-5 text-foreground hover:text-primary"
        >
          {card.title}
        </Link>

        {/* Space is reserved whether or not there are reviews. */}
        <div className="flex h-5 items-center gap-1">
          {card.rating ? (
            <>
              <RatingStars value={card.rating.average} />
              <span className="text-micro text-muted-foreground">
                {card.rating.average} ({card.rating.count})
              </span>
            </>
          ) : null}
        </div>

        <div className="min-h-6">
          <span className="text-price-md text-foreground">{card.priceLabel}</span>
          {card.originalPriceLabel ? (
            <span className="ml-1.5 text-small text-subtle-foreground line-through">{card.originalPriceLabel}</span>
          ) : null}
        </div>

        {card.unitPriceLabel ? <p className="text-micro text-subtle-foreground">{card.unitPriceLabel}</p> : null}

        {card.dealEndsAt ? <DealCountdown endsAt={card.dealEndsAt} compact /> : null}

        <p className="text-micro text-subtle-foreground">
          {card.digital ? `By ${card.cartLine.merchant.name}` : `Ships from ${card.shipsFrom}`}
        </p>
        <p className="min-h-4 text-micro text-success">
          {card.digital ? "Digital — no delivery" : card.arrivesLabel ? `Arrives ${card.arrivesLabel}` : ""}
        </p>

        <div className="mt-auto pt-3">
          {card.inStock ? (
            <button
              onClick={() => add(card.cartLine)}
              className="tap-target w-full rounded-md bg-primary text-small font-semibold text-foreground hover:bg-primary-hover lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
            >
              Add to cart
            </button>
          ) : (
            <button
              disabled
              className="tap-target w-full cursor-not-allowed rounded-md border border-border text-small font-medium text-subtle-foreground"
            >
              Out of stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-2 h-11 w-full" />
      </div>
    </div>
  );
}
