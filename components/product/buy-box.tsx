"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, RotateCcw, Share2 } from "lucide-react";
import type { PdpModel } from "@/lib/pdp";
import { formatMoneyWith, money } from "@/lib/money";
import { localePath } from "@/lib/locale";
import { formatVariantLabel } from "@/lib/card";
import { useCart, useSaved, useToast } from "@/components/providers";
import { BuyerProtectionNote } from "@/components/ui";
import { QuantityStepper } from "./quantity-stepper";
import { VariantSelector } from "./variant-selector";
import { DealCountdown } from "@/components/merchandising/deal-countdown";
import { DeliverToSelector } from "@/components/layout/deliver-to-selector";

export function BuyBox({
  model,
  locale,
  deliveryCostMinor,
  arrivesLabel,
}: {
  model: PdpModel;
  locale: string;
  deliveryCostMinor: number;
  arrivesLabel: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const { push } = useToast();
  const { isSaved, toggle } = useSaved();

  const [variantId, setVariantId] = useState(model.defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  const variant = model.variants.find((v) => v.id === variantId);
  const needsSelection = model.axes.length > 0 && !variant;

  // Selecting a variant updates the URL without a navigation.
  useEffect(() => {
    if (!variant) return;
    const url = new URL(window.location.href);
    url.searchParams.set("v", variant.sku);
    window.history.replaceState(null, "", url.toString());
  }, [variant]);

  // The sticky mobile bar appears once the real CTA leaves the viewport.
  useEffect(() => {
    const node = ctaRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const priceMinor = variant?.priceMinor ?? model.priceMinor;
  const stock = variant?.stock ?? model.totalStock;
  const maxQuantity = Math.max(1, Math.min(stock, model.maxPerOrder));
  const inStock = model.totalStock > 0 && (!variant || variant.stock > 0);

  const priceRange = useMemo(() => {
    const prices = model.variants.map((v) => v.priceMinor);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [model.variants]);

  const fmt = (minor: number) => formatMoneyWith(money(minor, model.currency), model.format);
  const saved = isSaved(model.id);

  function buildLine(qty: number) {
    return {
      productId: model.id,
      variantId: variant?.id,
      quantity: qty,
      title: model.title,
      href: model.href,
      imageSeed: model.imageSeed,
      variantLabel: variant ? formatVariantLabel(variant.attributes) : undefined,
      priceAtAdd: priceMinor,
      currency: model.currency,
      packClass: model.packClass,
      maxPerOrder: model.maxPerOrder,
      merchant: model.merchant,
    };
  }

  function addToCart() {
    if (needsSelection) return;
    add(buildLine(quantity));
  }

  function buyNow() {
    if (needsSelection) return;
    add(buildLine(quantity));
    router.push(localePath(locale, "/market/checkout"));
  }

  const showRange = !variant && priceRange.min !== priceRange.max;
  const originalMinor = model.originalPriceMinor;
  const savePercent =
    originalMinor && originalMinor > priceMinor
      ? Math.round(((originalMinor - priceMinor) / originalMinor) * 100)
      : null;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          {showRange ? (
            <p className="text-price-lg text-foreground">
              {fmt(priceRange.min)} – {fmt(priceRange.max)}
            </p>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-price-lg text-foreground">{fmt(priceMinor)}</span>
              {savePercent ? (
                <>
                  <span className="text-small text-subtle-foreground line-through">{fmt(originalMinor!)}</span>
                  <span className="text-small font-semibold text-success">Save {savePercent}%</span>
                </>
              ) : null}
            </div>
          )}
          {model.unitPrice ? (
            <p className="text-small text-muted-foreground">
              {fmt(model.unitPrice.minor)} per {model.unitPrice.unit}
            </p>
          ) : null}
          {model.deal?.endsAt ? <DealCountdown endsAt={model.deal.endsAt} /> : null}
        </div>

        <StockLine inStock={inStock} stock={stock} />

        {/* Variant state drives price, stock, SKU and the URL, so the selector
            lives with the buy box at every breakpoint rather than being mirrored. */}
        {model.axes.length ? (
          <VariantSelector model={model} variantId={variantId} onSelect={setVariantId} />
        ) : null}

        <div className="border-y border-border py-3">
          {model.digital ? (
            <>
              <p className="text-small font-semibold text-success">Digital — nothing ships</p>
              <p className="text-small text-muted-foreground">
                Sent to your email as soon as payment clears. No delivery charge.
              </p>
            </>
          ) : (
            <>
              <DeliverToSelector variant="inline" />
              {inStock ? (
                <>
                  <p className="mt-1 text-small text-foreground">
                    Arrives <span className="font-semibold text-success">{arrivesLabel}</span>
                  </p>
                  <p className="text-small text-muted-foreground">
                    {deliveryCostMinor === 0 ? "Free delivery" : `${fmt(deliveryCostMinor)} delivery`}
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>

        {inStock ? (
          <>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={maxQuantity}
              stock={stock}
              maxPerOrder={model.maxPerOrder}
            />

            <div ref={ctaRef} className="flex flex-col gap-2">
              {needsSelection ? (
                <p className="text-small text-warning">Select {model.axes.map((a) => a.label.toLowerCase()).join(" and ")}</p>
              ) : null}
              <button
                onClick={addToCart}
                disabled={needsSelection}
                className="tap-target w-full rounded-md bg-primary font-semibold text-foreground hover:bg-primary-hover disabled:bg-border disabled:text-subtle-foreground"
              >
                Add to cart
              </button>
              <button
                onClick={buyNow}
                disabled={needsSelection}
                className="tap-target w-full rounded-md bg-success font-semibold text-success-foreground hover:bg-success/90 disabled:bg-border disabled:text-subtle-foreground"
              >
                Buy now
              </button>
              {quantity > 1 ? (
                <p className="text-center text-small text-muted-foreground">
                  Total <span className="font-semibold text-foreground">{fmt(priceMinor * quantity)}</span>
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <button
            disabled
            className="tap-target w-full cursor-not-allowed rounded-md border border-border font-medium text-subtle-foreground"
          >
            Notify me when available
          </button>
        )}

        <BuyerProtectionNote merchantName={model.merchant.name} />

        <p className="flex items-center gap-1.5 text-small text-muted-foreground">
          <RotateCcw size={14} className="text-subtle-foreground" />
          7-day returns if the item is not as described
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => toggle(model.id)}
            aria-pressed={saved}
            className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-small font-medium text-foreground"
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"}  />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                try {
                  await navigator.share({ title: model.title, url });
                  return;
                } catch {
                  // Buyer dismissed the share sheet — fall through to copy.
                }
              }
              await navigator.clipboard.writeText(url);
              push({ message: "Link copied" });
            }}
            className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-small font-medium text-foreground"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Sticky mobile buy bar — the CTA never leaves the viewport. */}
      {!ctaVisible && inStock ? (
        <div className="fixed bottom-14 left-0 right-0 z-40 flex items-center gap-3 border-t border-border bg-card px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-price-md text-foreground">{fmt(priceMinor * quantity)}</p>
            <p className="truncate text-micro text-subtle-foreground">Arrives {arrivesLabel}</p>
          </div>
          <button
            onClick={addToCart}
            disabled={needsSelection}
            className="tap-target shrink-0 rounded-md bg-primary px-5 font-semibold text-foreground disabled:bg-border disabled:text-subtle-foreground"
          >
            Add to cart
          </button>
        </div>
      ) : null}
    </>
  );
}

function StockLine({ inStock, stock }: { inStock: boolean; stock: number }) {
  // Colour is never the only signal — the words carry the state.
  if (!inStock) return <p className="text-body font-semibold text-destructive">Out of stock</p>;
  if (stock <= 5) {
    return <p className="text-body font-semibold text-warning">Only {stock} left in stock</p>;
  }
  return (
    <p className="flex items-center gap-1 text-body font-semibold text-success">
      <Check size={16} /> In stock
    </p>
  );
}
