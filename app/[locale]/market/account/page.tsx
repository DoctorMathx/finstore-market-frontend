import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/account/account-view";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your account | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense
      fallback={
        <PageContainer className="py-6">
          <Skeleton className="h-80 w-full" />
        </PageContainer>
      }
    >
      <AccountView locale={locale} />
    </Suspense>
  );
}
