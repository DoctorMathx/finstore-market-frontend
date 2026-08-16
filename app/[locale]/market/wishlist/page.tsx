import type { Metadata } from "next";
import { SavedItemsView } from "@/components/product/saved-items-view";

export const metadata: Metadata = {
  title: "Saved items | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SavedItemsView locale={locale} />;
}
