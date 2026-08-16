import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEPARTMENTS, findCategory } from "@/lib/taxonomy";
import { BestSellersView } from "@/components/merchandising/best-sellers-view";
import type { SearchParamsInput } from "@/lib/plp";

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export function generateStaticParams() {
  return DEPARTMENTS.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = findCategory(categorySlug);
  if (!category || category.hidden) return {};
  return {
    title: `Best sellers in ${category.label} — buy online in Nigeria | Finstore Market`,
    description: `The most-bought ${category.label.toLowerCase()} on Finstore Market over the last 7 days.`,
  };
}

export default async function BestSellersCategoryPage({ params, searchParams }: Props) {
  const { locale, categorySlug } = await params;
  const category = findCategory(categorySlug);
  if (!category || category.hidden) notFound();
  return <BestSellersView locale={locale} searchParams={await searchParams} categorySlug={categorySlug} />;
}
