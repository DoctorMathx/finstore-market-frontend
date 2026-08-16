import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Order details | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  return (
    <Suspense
      fallback={
        <PageContainer className="py-6">
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      }
    >
      <OrderDetailView locale={locale} orderId={orderId} />
    </Suspense>
  );
}
