import type { Metadata } from "next";
import { ConfirmationView } from "@/components/orders/confirmation-view";

export const metadata: Metadata = {
  title: "Order placed | Finstore Market",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  return <ConfirmationView locale={locale} orderId={orderId} />;
}
