import type { Metadata } from "next";
import { OrdersListView } from "@/components/orders/orders-list-view";

export const metadata: Metadata = {
  title: "Your orders | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <OrdersListView locale={locale} />;
}
