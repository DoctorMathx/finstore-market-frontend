import type { CountryConfig } from "./country";
import { productHref } from "./data/catalog";
import { estimateArrival, formatDeliveryDate } from "./delivery";
import { discountPercent, formatMoney } from "./money";
import type { Product } from "./types";
import type { CartLine } from "./cart-types";

/**
 * A card's entire render surface, fully serializable. Formatting happens here —
 * at the render boundary — so no card component ever writes a currency symbol.
 */
export type CardModel = {
  id: string;
  title: string;
  href: string;
  imageSeed: string;
  priceLabel: string;
  originalPriceLabel?: string;
  discountPercent?: number;
  rating?: { average: number; count: number };
  shipsFrom: string;
  /** Nothing to ship — sent to the buyer instead. */
  digital: boolean;
  /** Only set when the estimate is real — a fake promise is worse than none. */
  arrivesLabel?: string;
  inStock: boolean;
  dealLabel?: string;
  dealEndsAt?: string;
  unitPriceLabel?: string;
  /** Everything the cart needs, captured at add time. */
  cartLine: CartLine;
};

export function toCardModel(
  product: Product,
  options: { config: CountryConfig; destinationState?: string },
): CardModel {
  const { config, destinationState } = options;
  const inStock = product.totalStock > 0;
  const variant = product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];

  const digital = product.packClass === "digital";
  const quote =
    destinationState && !digital
      ? estimateArrival(product.merchant, destinationState, product.packClass)
      : undefined;

  return {
    id: product.id,
    title: product.title,
    href: productHref(product),
    imageSeed: product.images[0].seed,
    priceLabel: formatMoney(product.price, config),
    originalPriceLabel:
      product.originalPrice && product.originalPriceVerified
        ? formatMoney(product.originalPrice, config)
        : undefined,
    discountPercent: discountPercent(product.price, product.originalPrice) ?? undefined,
    rating: product.rating ? { average: product.rating.average, count: product.rating.count } : undefined,
    shipsFrom: product.merchant.originState,
    digital,
    arrivesLabel: inStock && quote ? formatDeliveryDate(quote.estimatedDate) : undefined,
    inStock,
    dealLabel: product.deal?.label,
    dealEndsAt: product.deal?.endsAt,
    unitPriceLabel: product.unitPrice
      ? `${formatMoney(product.unitPrice.value, config)} per ${product.unitPrice.unit}`
      : undefined,
    cartLine: {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
      title: product.title,
      href: productHref(product),
      imageSeed: product.images[0].seed,
      variantLabel: variant ? formatVariantLabel(variant.attributes) : undefined,
      priceAtAdd: product.price.amount,
      currency: product.price.currency,
      packClass: product.packClass,
      maxPerOrder: product.maxPerOrder,
      merchant: {
        id: product.merchant.id,
        slug: product.merchant.slug,
        name: product.merchant.name,
        originCity: product.merchant.originCity,
        originState: product.merchant.originState,
        logoSeed: product.merchant.logoSeed,
      },
    },
  };
}

export function formatVariantLabel(attributes: Record<string, string>): string | undefined {
  const values = Object.values(attributes).filter(Boolean);
  return values.length ? values.join(", ") : undefined;
}

export function toCardModels(
  products: Product[],
  options: { config: CountryConfig; destinationState?: string },
): CardModel[] {
  return products.map((p) => toCardModel(p, options));
}
