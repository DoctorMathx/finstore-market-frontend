import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PageContainer, Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign in | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <PageContainer className="py-10">
      <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-md" />}>
        <SignInForm locale={locale} />
      </Suspense>
    </PageContainer>
  );
}
