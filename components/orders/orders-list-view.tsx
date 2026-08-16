"use client";

import Link from "next/link";
import { formatMoneyWith, money } from "@/lib/money";
import { formatDeliveryDate } from "@/lib/delivery";
import { localePath } from "@/lib/locale";
import { useOrders } from "@/lib/orders-store";
import { useMarket } from "@/components/providers";
import { EmptyState, MerchantLogo, PageContainer, ProductImage, Skeleton } from "@/components/ui";
import { OrderStatusChip } from "./order-pieces";

/** Sub-orders are the primary unit — that is what actually ships. */
export function OrdersListView({ locale }: { locale: string }) {
  const { config } = useMarket();
  const { orders, hydrated } = useOrders();

  const fmt = (minor: number) => formatMoneyWith(money(minor, config.currency.code), config.currency);

  if (!hydrated) {
    return (
      <PageContainer className="py-6">
        <Skeleton className="mb-3 h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </PageContainer>
    );
  }

  if (!orders.length) {
    return (
      <PageContainer className="py-10">
        <EmptyState
          title="No orders yet"
          body="When you order something, it shows here with tracking and a button to confirm receipt."
          action={
            <Link
              href={localePath(locale, "/market")}
              className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
            >
              Start shopping
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-4">
      <h1 className="mb-4 text-display">Your orders</h1>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <section key={order.id} className="rounded-lg surface-raised">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background-alt px-4 py-3 text-small">
              <div>
                <p className="font-semibold text-foreground">Order {order.id}</p>
                <p className="text-muted-foreground">
                  Placed {new Date(order.placedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <p className="text-muted-foreground">
                Total <span className="font-semibold text-foreground">{fmt(order.total)}</span>
              </p>
            </header>

            <ul className="divide-y divide-border">
              {order.subOrders.map((sub) => (
                <li key={sub.id} className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <MerchantLogo seed={sub.merchant.logoSeed} name={sub.merchant.name} size={28} />
                    <p className="min-w-0 flex-1 truncate text-small font-semibold text-foreground">{sub.merchant.name}</p>
                    <OrderStatusChip status={sub.status} />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex shrink-0 gap-1">
                      {sub.items.slice(0, 3).map((item) => (
                        <span key={item.title} className="h-14 w-14 overflow-hidden rounded-md border border-border">
                          <ProductImage seed={item.imageSeed} alt="" label={item.title} className="h-full w-full" />
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-small text-foreground">
                        {sub.items.map((i) => i.title).join(", ")}
                      </p>
                      {sub.estimatedDate && sub.status !== "completed" ? (
                        <p className="text-small text-muted-foreground">
                          Arrives {formatDeliveryDate(sub.estimatedDate)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={localePath(locale, `/market/orders/${order.id}?sub=${sub.id}`)}
                    className="tap-target mt-3 inline-flex items-center rounded-md border border-border px-3 text-small font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    View details and track
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
