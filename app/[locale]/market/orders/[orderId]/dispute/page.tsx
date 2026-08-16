import type { Metadata } from "next";
import { Suspense } from "react";
import { IssueForm } from "@/components/orders/issue-forms";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Report an issue | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function DisputePage({
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
      <IssueForm locale={locale} orderId={orderId} mode="dispute" />
    </Suspense>
  );
}
