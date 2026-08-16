import type { Metadata } from "next";
import { Suspense } from "react";
import { IssueForm } from "@/components/orders/issue-forms";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Request a return | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  return (
    <Suspense
      fallback={
        <PageContainer className="py-6">
          <Skeleton className="h-80 w-full" />
        </PageContainer>
      }
    >
      <IssueForm locale={locale} orderId={orderId} mode="return" />
    </Suspense>
  );
}
