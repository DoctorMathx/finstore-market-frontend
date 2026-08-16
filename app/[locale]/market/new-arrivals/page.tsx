import type { Metadata } from "next";
import { NewArrivalsView } from "@/components/merchandising/new-arrivals-view";
import type { SearchParamsInput } from "@/lib/plp";

export const metadata: Metadata = {
  title: "New arrivals — buy online in Nigeria | Finstore Market",
  description: "Recently listed products from established merchants on Finstore Market.",
};

export default async function NewArrivalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { locale } = await params;
  return <NewArrivalsView locale={locale} searchParams={await searchParams} />;
}
