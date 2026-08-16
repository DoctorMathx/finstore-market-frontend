"use client";

import { PageContainer } from "@/components/ui";

/** States what failed and offers retry — never a bare error screen. */
export default function MarketError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageContainer className="py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
        <h1 className="text-h1">Couldn&apos;t load this page</h1>
        <p className="text-body text-muted-foreground">
          Something went wrong on our side. Your cart and saved items are untouched.
        </p>
        <button
          onClick={reset}
          className="tap-target rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Try again
        </button>
      </div>
    </PageContainer>
  );
}
