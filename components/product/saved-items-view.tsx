"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale";
import { useSaved } from "@/components/providers";
import { EmptyState, PageContainer } from "@/components/ui";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { useCardModels } from "./recently-viewed-rail";

export function SavedItemsView({ locale }: { locale: string }) {
  const { saved } = useSaved();
  const { cards, loading } = useCardModels(saved);

  return (
    <PageContainer className="py-4">
      <h1 className="mb-1 text-display">Saved items</h1>
      <p className="mb-4 text-small text-muted-foreground">
        Saved on this device. Sign in to keep them when you switch phones.
      </p>

      {!saved.length ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the heart on any product to keep it here. Saved items are not reserved — popular stock still sells out."
          action={
            <Link
              href={localePath(locale, "/market")}
              className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
            >
              Browse categories
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading
            ? Array.from({ length: Math.min(saved.length, 10) }, (_, i) => <ProductCardSkeleton key={i} />)
            : cards.map((card) => <ProductCard key={card.id} card={card} locale={locale} />)}
        </div>
      )}
    </PageContainer>
  );
}
