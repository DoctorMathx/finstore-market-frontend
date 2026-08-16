import type { Metadata } from "next";
import Link from "next/link";
import { HELP_TOPICS } from "@/lib/help";
import { localePath } from "@/lib/locale";
import { PageContainer } from "@/components/ui";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export const metadata: Metadata = {
  title: "Help centre | Finstore Market",
  description: "How buying, delivery, returns and payment work on Finstore Market.",
};

const GROUPS = ["Buying", "Selling", "Policies", "Company"] as const;

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <PageContainer className="py-2">
      <Breadcrumb crumbs={[{ label: "Help" }]} locale={locale} />
      <h1 className="mb-1 text-display">Help centre</h1>
      <p className="mb-6 text-body text-muted-foreground">
        Short answers in plain language. If you can&apos;t find it here, message us on WhatsApp.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group}>
            <h2 className="mb-2 text-h2">{group}</h2>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
              {HELP_TOPICS.filter((topic) => topic.group === group).map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={localePath(locale, `/market/help/${topic.slug}`)}
                    className="block px-4 py-3 hover:bg-background-alt"
                  >
                    <span className="block text-body font-medium text-foreground">{topic.title}</span>
                    <span className="block text-small text-muted-foreground">{topic.summary}</span>
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
