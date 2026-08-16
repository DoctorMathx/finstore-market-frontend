import { permanentRedirect } from "next/navigation";
import { findCategory } from "@/lib/taxonomy";
import { notFound } from "next/navigation";

/**
 * Nested category paths resolve to the same node as the flat path. Slugs are
 * globally unique and permanent, so one canonical URL per category is the flat
 * one — this route exists to catch inbound deep links and fold them into it.
 */
export default async function NestedCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; sub: string }>;
}) {
  const { locale, sub } = await params;
  if (!findCategory(sub)) notFound();
  permanentRedirect(`/${locale}/market/c/${sub}`);
}
