import Link from "next/link";
import { PageContainer, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <PageContainer className="py-16">
      <EmptyState
        title="We couldn't find that page"
        body="The link may be old, or the product may have been delisted by its store. Everything else is still here."
        action={
          <Link
            href="/en-NG/market"
            className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
          >
            Go to Finstore Market
          </Link>
        }
      />
    </PageContainer>
  );
}
