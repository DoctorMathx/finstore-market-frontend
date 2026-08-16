"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoneyWith, money } from "@/lib/money";
import { formatDeliveryDate } from "@/lib/delivery";
import { localePath } from "@/lib/locale";
import { updateOrder, useOrder, type StoredSubOrder } from "@/lib/orders-store";
import { useMarket, useToast } from "@/components/providers";
import { EmptyState, InlineAlert, MerchantLogo, PageContainer, ProductImage, Skeleton } from "@/components/ui";
import { OrderStatusChip, OrderTimeline, RiderContact } from "./order-pieces";

/** The buyer has this long to inspect before the release happens automatically. */
const INSPECTION_HOURS = 48;

export function OrderDetailView({ locale, orderId }: { locale: string; orderId: string }) {
  const { config } = useMarket();
  const { push } = useToast();
  const search = useSearchParams();
  // The store is subscribed, so a mutation re-renders this view on its own.
  const { order, hydrated } = useOrder(orderId);

  const fmt = (minor: number) => formatMoneyWith(money(minor, config.currency.code), config.currency);

  function mutate(subId: string, change: Partial<StoredSubOrder>) {
    updateOrder(orderId, (o) => ({
      ...o,
      subOrders: o.subOrders.map((s) => (s.id === subId ? { ...s, ...change } : s)),
    }));
  }

  if (!hydrated) {
    return (
      <PageContainer className="py-6">
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer className="py-10">
        <EmptyState
          title="Order not found"
          body="This order isn't on this device. Sign in with the phone number you used at checkout."
          action={
            <Link
              href={localePath(locale, "/market/orders")}
              className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
            >
              Back to orders
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const highlighted = search.get("sub");

  return (
    <PageContainer className="flex flex-col gap-5 py-4">
      <div>
        <Link href={localePath(locale, "/market/orders")} className="text-small font-medium text-primary">
          ← All orders
        </Link>
        <h1 className="mt-1 text-display">Order {order.id}</h1>
        <p className="text-small text-muted-foreground">
          Placed{" "}
          {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
          {order.subOrders.length} delivery{order.subOrders.length === 1 ? "" : "ies"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {order.subOrders.map((sub) => (
            <section
              key={sub.id}
              className={`rounded-lg border bg-card ${
                highlighted === sub.id ? "border-primary" : "border-border"
              }`}
            >
              <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <MerchantLogo seed={sub.merchant.logoSeed} name={sub.merchant.name} size={32} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={localePath(locale, `/market/store/${sub.merchant.slug}`)}
                    className="text-body font-semibold text-foreground hover:text-primary"
                  >
                    {sub.merchant.name}
                  </Link>
                  <p className="text-small text-subtle-foreground">{sub.id}</p>
                </div>
                <OrderStatusChip status={sub.status} />
              </header>

              <div className="grid gap-5 p-4 lg:grid-cols-2">
                <div>
                  <OrderTimeline status={sub.status} />
                  {sub.status === "on_the_way" && sub.riderName && sub.riderPhone ? (
                    <div className="mt-3">
                      <RiderContact name={sub.riderName} phone={sub.riderPhone} />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-3">
                    {sub.items.map((item) => (
                      <li key={item.title} className="flex gap-3">
                        <Link
                          href={localePath(locale, item.href)}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"
                        >
                          <ProductImage seed={item.imageSeed} alt="" label={item.title} className="h-full w-full" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={localePath(locale, item.href)}
                            className="line-clamp-2 text-small text-foreground hover:text-primary"
                          >
                            {item.title}
                          </Link>
                          <p className="text-micro text-subtle-foreground">
                            {item.variantLabel ? `${item.variantLabel} · ` : ""}Qty {item.quantity}
                          </p>
                          <p className="text-small font-medium text-foreground">{fmt(item.unitPrice * item.quantity)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <dl className="border-t border-border pt-2 text-small">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Items</dt>
                      <dd className="font-medium text-foreground">{fmt(sub.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Delivery</dt>
                      <dd className="font-medium text-foreground">{fmt(sub.deliveryCost)}</dd>
                    </div>
                    {sub.estimatedDate && sub.status !== "completed" ? (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Expected</dt>
                        <dd className="font-medium text-success">{formatDeliveryDate(sub.estimatedDate)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <ConfirmReceiptPanel
                    sub={sub}
                    onConfirm={() => {
                      mutate(sub.id, { status: "completed" });
                      push({ message: `${sub.merchant.name} has been paid. Thanks for confirming.` });
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={localePath(locale, `/market/orders/${order.id}/dispute?sub=${sub.id}`)}
                      className="tap-target inline-flex items-center rounded-md border border-border px-3 text-small font-medium text-foreground hover:border-destructive hover:text-destructive"
                    >
                      Report an issue
                    </Link>
                    {sub.status === "delivered" || sub.status === "completed" ? (
                      <Link
                        href={localePath(locale, `/market/orders/${order.id}/return?sub=${sub.id}`)}
                        className="tap-target inline-flex items-center rounded-md border border-border px-3 text-small font-medium text-foreground"
                      >
                        Request a return
                      </Link>
                    ) : null}
                  </div>

                  <DemoAdvance sub={sub} onAdvance={(change) => mutate(sub.id, change)} />
                </div>
              </div>
            </section>
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-h2">Delivery address</h2>
            <p className="text-body text-foreground">{order.address.fullName}</p>
            <p className="text-body text-muted-foreground">
              {order.address.street}
              {order.address.landmark ? `, ${order.address.landmark}` : ""}, {order.address.subRegion},{" "}
              {order.address.region}
            </p>
            <p className="text-body text-muted-foreground">{order.address.phone}</p>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-h2">Payment</h2>
            <dl className="flex flex-col gap-1.5 text-body">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="font-medium text-foreground">{fmt(order.itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium text-foreground">{fmt(order.deliveryTotal)}</dd>
              </div>
              {order.discount ? (
                <div className="flex justify-between">
                  <dt className="text-success">{order.discount.label}</dt>
                  <dd className="font-medium text-success">− {fmt(order.discount.amount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="text-h2">Total</dt>
                <dd className="text-price-md text-foreground">{fmt(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-small text-subtle-foreground">Paid by {order.paymentMethod}</p>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}

/**
 * Confirm receipt is the buyer's release trigger, so it is the most prominent
 * control on the page while the inspection window is open.
 */
function ConfirmReceiptPanel({ sub, onConfirm }: { sub: StoredSubOrder; onConfirm: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (sub.status !== "delivered" || !sub.deliveredAt) return;
    const deadline = Date.parse(sub.deliveredAt) + INSPECTION_HOURS * 3_600_000;
    const tick = () => setRemaining(deadline - Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [sub.status, sub.deliveredAt]);

  if (sub.status === "completed") {
    return <InlineAlert tone="success">You confirmed this delivery. {sub.merchant.name} has been paid.</InlineAlert>;
  }

  if (sub.status !== "delivered") {
    return (
      <InlineAlert tone="info">
        Your money is held until you confirm delivery. Nothing is released to {sub.merchant.name} before then.
      </InlineAlert>
    );
  }

  const hours = remaining != null ? Math.max(0, Math.floor(remaining / 3_600_000)) : INSPECTION_HOURS;

  return (
    <div className="rounded-md border border-success/30 bg-success-soft p-3">
      <p className="text-body font-semibold text-foreground">Did it arrive as described?</p>
      <p className="mt-0.5 text-small text-muted-foreground">
        Check the item before confirming. Auto-confirms in {hours} hours if you do nothing.
      </p>
      <button
        onClick={onConfirm}
        className="tap-target mt-2 w-full rounded-md bg-success font-semibold text-success-foreground hover:bg-success/90"
      >
        Confirm receipt
      </button>
    </div>
  );
}

/**
 * Demo-only. The real statuses come from the dispatch and settlement services;
 * this exists so the timeline, rider contact and confirm-receipt states are
 * reachable without a backend.
 */
function DemoAdvance({
  sub,
  onAdvance,
}: {
  sub: StoredSubOrder;
  onAdvance: (change: Partial<StoredSubOrder>) => void;
}) {
  const next: Record<string, { label: string; change: Partial<StoredSubOrder> }> = {
    awaiting_confirmation: { label: "Store confirms", change: { status: "preparing" } },
    preparing: {
      label: "Rider picks up",
      change: { status: "on_the_way", riderName: "Emeka O.", riderPhone: "0803 555 0142" },
    },
    on_the_way: { label: "Mark delivered", change: { status: "delivered", deliveredAt: new Date().toISOString() } },
  };
  const action = next[sub.status];
  if (!action) return null;

  return (
    <button
      onClick={() => onAdvance(action.change)}
      className="self-start text-micro text-subtle-foreground underline hover:text-muted-foreground"
    >
      Demo: {action.label}
    </button>
  );
}
