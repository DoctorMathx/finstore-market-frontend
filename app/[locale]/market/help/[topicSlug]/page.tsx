import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HELP_TOPICS, helpTopic } from "@/lib/help";
import { localePath } from "@/lib/locale";
import { PageContainer } from "@/components/ui";
import { Breadcrumb } from "@/components/layout/breadcrumb";

type Props = { params: Promise<{ locale: string; topicSlug: string }> };

export function generateStaticParams() {
  return HELP_TOPICS.map((topic) => ({ topicSlug: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = helpTopic(topicSlug);
  if (!topic) return {};
  return { title: `${topic.title} | Finstore Market`, description: topic.summary };
}

export default async function HelpTopicPage({ params }: Props) {
  const { locale, topicSlug } = await params;
  const topic = helpTopic(topicSlug);
  if (!topic) notFound();

  return (
    <PageContainer className="py-2">
      <Breadcrumb
        crumbs={[{ label: "Help", href: "/market/help" }, { label: topic.title }]}
        locale={locale}
      />
      <article className="max-w-2xl">
        <h1 className="text-display">{topic.title}</h1>
        <div className="mt-4 flex flex-col gap-3">
          {topic.body.map((paragraph) => (
            <p key={paragraph} className="text-body text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
        <Link
          href={localePath(locale, "/market/help")}
          className="mt-6 inline-block text-small font-medium text-primary"
        >
          ← All help topics
        </Link>
      </article>
    </PageContainer>
  );
}
