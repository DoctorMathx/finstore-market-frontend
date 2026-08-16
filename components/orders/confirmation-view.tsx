"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatMoneyWith, money } from "@/lib/money";
import { formatDeliveryDate } from "@/lib/delivery";
import { localePath } from "@/lib/locale";
import { useOrder } from "@/lib/orders-store";
import { useMarket } from "@/components/providers";
import { EmptyState, MerchantLogo, PageContainer, Skeleton } from "@/components/ui";

const NEXT_STEPS = [
  { title: "The store confirms", body: "Usually within a few hours. You get a notification either way." },
  { title: "Item is picked up", body: "A rider collects it and you can see the tracking update." },
  { title: "Out for delivery", body: "The rider calls the number on your address before arriving." },
  { title: "You confirm receipt", body: "Check the item first. The store is paid only once you confirm." },
];

export function ConfirmationView({ locale, orderId }: { locale: string; orderId: string }) {
  const { config } = useMarket();
  const { order, hydrated } = useOrder(orderId);

  const fmt = (minor: number) => formatMoneyWith(money(minor, config.currency.code), config.currency);

  if (!hydrated) {
    return (
      <PageContainer className="py-6">
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer className="py-10">
        <EmptyState
          title="We can't find that order"
          body="It may have been placed on another device. Sign in to see every order on your account."
          action={
            <Link
              href={localePath(locale, "/market/orders")}
              className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
            >
              Go to your orders
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-6 py-6">
      <div className="flex flex-col items-start gap-2 rounded-lg border border-success/30 bg-success-soft p-5">
        <CheckCircle2 size={28} className="text-success" />
        <h1 className="text-display">Order placed</h1>
        <p className="text-body text-muted-foreground">
          Order <span className="font-semibold text-foreground">{order.id}</span> · {fmt(order.total)} paid by{" "}
          {order.paymentMethod}
        </p>
        <p className="text-small text-muted-foreground">
          Your money is held safely. Each store is paid only after you confirm their part arrived.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-h2">
          {order.subOrders.length} delivery{order.subOrders.length === 1 ? "" : "ies"} in this order
        </h2>
        <div className="flex flex-col gap-3">
          {order.subOrders.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <MerchantLogo seed={sub.merchant.logoSeed} name={sub.merchant.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-foreground">{sub.merchant.name}</p>
                  <p className="text-small text-subtle-foreground">Sub-order {sub.id}</p>
                </div>
                {sub.estimatedDate ? (
                  <p className="text-small font-medium text-success">Arrives {formatDeliveryDate(sub.estimatedDate)}</p>
                ) : null}
              </div>
              <ul className="mt-3 flex flex-col gap-1 text-small text-muted-foreground">
                {sub.items.map((item) => (
                  <li key={item.title} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">{fmt(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-border pt-1">
                  <span>Delivery</span>
                  <span className="font-medium text-foreground">{fmt(sub.deliveryCost)}</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-h2">What happens next</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary">
                {index + 1}
              </span>
              <p className="text-body font-medium text-foreground">{step.title}</p>
              <p className="text-small text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href={localePath(locale, `/market/orders/${order.id}`)}
          className="tap-target inline-flex items-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
        >
          Track this order
        </Link>
        <Link
          href={localePath(locale, "/market")}
          className="tap-target inline-flex items-center rounded-md border border-border px-5 font-medium text-foreground"
        >
          Continue shopping
        </Link>
      </div>
    </PageContainer>
  );
}
