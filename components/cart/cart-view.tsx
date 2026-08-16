"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import { formatMoneyWith, money } from "@/lib/money";
import { formatDeliveryDate } from "@/lib/delivery";
import { localePath } from "@/lib/locale";
import { useCart, useMarket, useSaved, useToast } from "@/components/providers";
import { EmptyState, InlineAlert, MerchantLogo, PageContainer, ProductImage, Skeleton } from "@/components/ui";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { useCartValidation } from "./use-cart-validation";

export function CartView({ locale }: { locale: string }) {
  const { config } = useMarket();
  const { lines, setQuantity, remove, restore, hydrated } = useCart();
  const { toggle } = useSaved();
  const { push } = useToast();
  const state = useCartValidation();

  const fmt = (minor: number) => formatMoneyWith(money(minor, config.currency.code), config.currency);

  if (!hydrated) {
    return (
      <PageContainer className="py-6 lg:py-8">
        <Skeleton className="mb-4 h-8 w-56" />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!lines.length) {
    return (
      <PageContainer className="py-8">
        <EmptyState
          title="Your cart is empty"
          body="Browse a category or pick up where you left off — nothing here is lost, saved items stay in your account."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={localePath(locale, "/market")}
                className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
              >
                Browse categories
              </Link>
              <Link
                href={localePath(locale, "/market/deals")}
                className="tap-target inline-flex items-center rounded-md border border-border px-4 font-medium text-foreground"
              >
                See today&apos;s deals
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <PageContainer className="py-6 lg:py-8">
      <h1 className="mb-1 text-display">
        Cart ({itemCount} item{itemCount === 1 ? "" : "s"} from {state.groups.length} store
        {state.groups.length === 1 ? "" : "s"})
      </h1>
      <p className="mb-4 text-small text-muted-foreground">
        Delivery is charged per store. Items from the same store ship together and cost less.
      </p>

      {state.failed ? (
        <div className="mb-4">
          <InlineAlert tone="danger">
            Couldn&apos;t check stock and delivery prices.{" "}
            <button onClick={state.retry} className="font-semibold underline">
              Try again
            </button>
          </InlineAlert>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {state.groups.map((group) => (
            <section key={group.merchant.id} className="rounded-xl surface-raised">
              <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <MerchantLogo seed={group.merchant.logoSeed} name={group.merchant.name} size={32} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={localePath(locale, `/market/store/${group.merchant.slug}`)}
                    className="text-body font-semibold text-foreground hover:text-primary"
                  >
                    {group.merchant.name}
                  </Link>
                  <p className="text-small text-muted-foreground">
                    {group.merchant.originCity}, {group.merchant.originState}
                  </p>
                </div>
                {/* Each group carries its own date — a blended date across merchants is a lie. */}
                {group.estimatedDate ? (
                  <p className="text-small font-medium text-success">
                    Arrives {formatDeliveryDate(group.estimatedDate)}
                  </p>
                ) : state.loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : null}
              </header>

              <ul className="divide-y divide-border">
                {group.lines.map((line) => {
                  const priceChanged = line.currentPrice !== line.priceAtAdd;
                  return (
                    <li key={`${line.productId}-${line.variantId}`} className="flex gap-3 p-4">
                      <Link
                        href={localePath(locale, line.href)}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border"
                      >
                        <ProductImage seed={line.imageSeed} alt="" label={line.title} className="h-full w-full" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={localePath(locale, line.href)}
                          className="line-clamp-2 text-body text-foreground hover:text-primary"
                        >
                          {line.title}
                        </Link>
                        {line.variantLabel ? <p className="text-small text-muted-foreground">{line.variantLabel}</p> : null}
                        <p className="mt-1 text-price-md text-foreground">{fmt(line.currentPrice)}</p>

                        {/* Price moves are surfaced on the line, never folded silently into the total. */}
                        {priceChanged ? (
                          <p className="mt-1 text-small text-warning">
                            Price changed from {fmt(line.priceAtAdd)} since you added this.
                          </p>
                        ) : null}
                        {line.stock <= 5 ? (
                          <p className="mt-1 text-small text-warning">Only {line.stock} left</p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <QuantityStepper
                            value={line.quantity}
                            onChange={(next) => setQuantity(line.productId, line.variantId, next)}
                            max={Math.max(1, Math.min(line.stock, line.maxPerOrder))}
                            stock={line.stock}
                            maxPerOrder={line.maxPerOrder}
                          />
                          <button
                            onClick={() => {
                              const index = lines.findIndex(
                                (l) => l.productId === line.productId && l.variantId === line.variantId,
                              );
                              const snapshot = lines[index];
                              remove(line.productId, line.variantId);
                              push({
                                message: "Removed from cart",
                                duration: 8000,
                                action: { label: "Undo", onClick: () => restore(snapshot, index) },
                              });
                            }}
                            className="text-small font-medium text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              toggle(line.productId);
                              remove(line.productId, line.variantId);
                              push({ message: "Moved to saved items" });
                            }}
                            className="text-small font-medium text-muted-foreground hover:text-primary"
                          >
                            Save for later
                          </button>
                        </div>

                        {line.quantity > 1 ? (
                          <p className="mt-2 text-small text-muted-foreground">
                            Subtotal{" "}
                            <span className="font-semibold text-foreground">{fmt(line.currentPrice * line.quantity)}</span>
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-small">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck size={15} className="text-subtle-foreground" />
                  Delivery from this store
                </span>
                {state.loading && !group.deliveryCost ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="font-semibold text-foreground">{fmt(group.deliveryCost)}</span>
                )}
              </footer>
            </section>
          ))}

          {state.unavailable.length ? (
            <section className="rounded-lg border border-border bg-background-alt p-4">
              <h2 className="text-h2">No longer available</h2>
              <p className="mb-3 text-small text-muted-foreground">
                These went out of stock after you added them. They are not included in your total and will not block
                checkout.
              </p>
              <ul className="flex flex-col gap-3">
                {state.unavailable.map((line) => (
                  <li key={`${line.productId}-${line.variantId}`} className="flex items-center gap-3">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border opacity-60">
                      <ProductImage seed={line.imageSeed} alt="" label={line.title} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-small text-muted-foreground">{line.title}</span>
                    <button
                      onClick={() => remove(line.productId, line.variantId)}
                      className="shrink-0 text-small font-medium text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h,0px)+1.5rem)] lg:h-fit">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-h2">Order summary</h2>
            <dl className="flex flex-col gap-2 text-body">
              <Row label={`Items (${itemCount})`} value={fmt(state.itemsTotal)} />
              <Row
                label={`Delivery (${state.groups.length} store${state.groups.length === 1 ? "" : "s"})`}
                value={state.loading ? "—" : fmt(state.deliveryTotal)}
              />
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <dt className="text-h2">Total</dt>
                <dd className="text-price-lg text-foreground">{fmt(state.total)}</dd>
              </div>
            </dl>

            <Link
              href={localePath(locale, "/market/checkout")}
              className="tap-target mt-4 flex w-full items-center justify-center rounded-md bg-primary font-semibold text-foreground hover:bg-primary-hover"
            >
              Checkout
            </Link>

            <p className="mt-3 rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-small text-muted-foreground">
              <span className="font-semibold text-primary">Buyer protection.</span> Stores are paid after you confirm
              delivery.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
