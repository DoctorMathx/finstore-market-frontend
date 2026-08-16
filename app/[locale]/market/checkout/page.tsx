import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense
      fallback={
        <PageContainer className="py-6">
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      }
    >
      <CheckoutView locale={locale} />
    </Suspense>
  );
}
