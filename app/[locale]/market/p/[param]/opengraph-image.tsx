import { productByRouteParam } from "@/lib/data/catalog";
import { getCountry } from "@/lib/country";
import { formatMoney } from "@/lib/money";
import { OG_SIZE, productBanner, siteBanner } from "@/lib/og";

/** Per-product share card: title, price, and who is actually selling it. */
export const alt = "Product on Finstore Market";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; param: string }>;
}) {
  const { locale, param } = await params;
  const product = productByRouteParam(param);
  // A dead link still shares as a branded card, never a broken image.
  if (!product) return siteBanner();

  const config = getCountry(locale.split("-")[1] ?? "NG");
  return productBanner({
    title: product.title,
    priceLabel: formatMoney(product.price, config),
    originalPriceLabel:
      product.originalPrice && product.originalPriceVerified
        ? formatMoney(product.originalPrice, config)
        : undefined,
    merchantName: product.merchant.name,
    originState: product.merchant.originState,
    digital: product.packClass === "digital",
  });
}
