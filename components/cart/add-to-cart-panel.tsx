"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { formatMoneyWith, money } from "@/lib/money";
import { localePath } from "@/lib/locale";
import { useCart, useMarket } from "@/components/providers";
import { ProductImage } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Add-to-cart from a card or the PDP slides this in rather than changing route.
 * Losing the buyer's place in a grid to confirm an add is a conversion cost.
 *
 * Built on the Radix sheet so focus trapping, scroll locking, Escape and the
 * aria dialog contract come from the primitive instead of being hand-rolled.
 */
export function AddToCartPanelHost({ locale }: { locale: string }) {
  const { lastAdded, clearLastAdded, lines } = useCart();
  const { config } = useMarket();

  const subtotal = lines.reduce((sum, l) => sum + l.priceAtAdd * l.quantity, 0);

  return (
    <Sheet open={Boolean(lastAdded)} onOpenChange={(open) => !open && clearLastAdded()}>
      <SheetContent side="right" className="w-full gap-0 border-border bg-card p-0 sm:max-w-[380px]">
        {lastAdded ? (
          <>
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-body font-semibold text-success">
                <Check size={18} /> Added to cart
              </SheetTitle>
              <SheetDescription className="sr-only">
                {lastAdded.title} was added to your cart.
              </SheetDescription>
            </SheetHeader>

            <div className="flex gap-3 px-4 py-4">
              <span className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                <ProductImage seed={lastAdded.imageSeed} alt="" label={lastAdded.title} className="h-full w-full" />
              </span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-body text-foreground">{lastAdded.title}</p>
                {lastAdded.variantLabel ? (
                  <p className="text-small text-muted-foreground">{lastAdded.variantLabel}</p>
                ) : null}
                <p className="mt-1 text-price-md text-foreground">
                  {formatMoneyWith(money(lastAdded.priceAtAdd, lastAdded.currency), config.currency)}
                </p>
                <p className="text-small text-subtle-foreground">Qty {lastAdded.quantity}</p>
              </div>
            </div>

            <div className="mt-auto border-t border-border px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-body text-muted-foreground">Cart subtotal</span>
                <span className="text-price-md text-foreground">
                  {formatMoneyWith(money(subtotal, config.currency.code), config.currency)}
                </span>
              </div>
              <Button asChild className="tap-target mb-2 w-full font-semibold">
                <Link href={localePath(locale, "/market/cart")} onClick={clearLastAdded}>
                  Go to cart
                </Link>
              </Button>
              <Button variant="outline" onClick={clearLastAdded} className="tap-target w-full font-medium">
                Continue shopping
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
