"use client";

import { useEffect, useState } from "react";
import type { CardModel } from "@/lib/card";
import { useMarket, useSaved } from "@/components/providers";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { SectionHeading } from "@/components/ui";

export function useCardModels(ids: string[]): { cards: CardModel[]; loading: boolean } {
  const { locale } = useMarket();
  const key = ids.join(",");
  // Loading is derived from which request last settled — the effect only ever
  // sets state from the async completion, never synchronously.
  const [result, setResult] = useState<{ key: string; cards: CardModel[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/products?ids=${key}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResult({ key, cards: data.cards ?? [] });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, cards: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [key, locale]);

  const cards = key && result?.key === key ? result.cards : [];
  return { cards, loading: Boolean(key) && result?.key !== key };
}

/** Renders nothing at all when there is no history — never an empty shell. */
export function RecentlyViewedRail({ locale }: { locale: string }) {
  const { recentlyViewed } = useSaved();
  const { cards, loading } = useCardModels(recentlyViewed.slice(0, 12));

  if (!recentlyViewed.length) return null;

  return (
    <section>
      <SectionHeading title="Recently viewed" />
      <div className="rail -mx-4 px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-44 lg:w-auto">
                <ProductCardSkeleton />
              </div>
            ))
          : cards.map((card) => (
              <div key={card.id} className="w-40 shrink-0 snap-start sm:w-44 lg:w-auto">
                <ProductCard card={card} locale={locale} variant="rail" />
              </div>
            ))}
      </div>
    </section>
  );
}
