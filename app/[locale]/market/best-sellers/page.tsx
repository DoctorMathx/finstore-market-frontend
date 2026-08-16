import type { Metadata } from "next";
import { BestSellersView } from "@/components/merchandising/best-sellers-view";
import type { SearchParamsInput } from "@/lib/plp";

export const metadata: Metadata = {
  title: "Best sellers — buy online in Nigeria | Finstore Market",
  description: "The most-bought products on Finstore Market over the last 7 days, by completed orders.",
};

export default async function BestSellersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { locale } = await params;
  return <BestSellersView locale={locale} searchParams={await searchParams} />;
}
