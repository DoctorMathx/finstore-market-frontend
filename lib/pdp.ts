import type { CountryConfig } from "./country";
import { moneyFormat, type MoneyFormat } from "./money";
import { productHref } from "./data/catalog";
import type { Product } from "./types";

/**
 * Everything the interactive half of the PDP needs, fully serializable so the
 * buy box, gallery and variant selector can be client islands over a
 * server-rendered page.
 */
export type PdpVariant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  priceMinor: number;
  stock: number;
};

export type PdpModel = {
  id: string;
  title: string;
  href: string;
  currency: "NGN" | "GHS" | "KES" | "ZAR";
  format: MoneyFormat;
  priceMinor: number;
  originalPriceMinor?: number;
  unitPrice?: { minor: number; unit: string };
  variants: PdpVariant[];
  /** Ordered axes, max two. Axis 1 renders as swatches or pills, axis 2 as pills. */
  axes: { key: string; label: string; values: string[] }[];
  defaultVariantId?: string;
  maxPerOrder: number;
  packClass: Product["packClass"];
  totalStock: number;
  digital: boolean;
  imageSeed: string;
  deal?: { kind: string; label?: string; endsAt?: string };
  merchant: {
    id: string;
    slug: string;
    name: string;
    logoSeed: string;
    originCity: string;
    originState: string;
  };
};

const AXIS_LABELS: Record<string, string> = {
  colour: "Colour",
  size: "Size",
  storage: "Storage",
  ram: "RAM",
  capacity: "Capacity",
  weight: "Weight",
};

export function toPdpModel(product: Product, config: CountryConfig): PdpModel {
  const keys = [...new Set(product.variants.flatMap((v) => Object.keys(v.attributes)))].slice(0, 2);

  return {
    id: product.id,
    title: product.title,
    href: productHref(product),
    currency: product.price.currency,
    format: moneyFormat(config),
    priceMinor: product.price.amount,
    originalPriceMinor: product.originalPriceVerified ? product.originalPrice?.amount : undefined,
    unitPrice: product.unitPrice
      ? { minor: product.unitPrice.value.amount, unit: product.unitPrice.unit }
      : undefined,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      attributes: v.attributes,
      priceMinor: v.price.amount,
      stock: v.stock,
    })),
    axes: keys.map((key) => ({
      key,
      label: AXIS_LABELS[key] ?? key,
      values: [...new Set(product.variants.map((v) => v.attributes[key]).filter(Boolean))],
    })),
    defaultVariantId: product.defaultVariantId,
    maxPerOrder: product.maxPerOrder,
    packClass: product.packClass,
    totalStock: product.totalStock,
    digital: product.packClass === "digital",
    imageSeed: product.images[0].seed,
    deal: product.deal,
    merchant: {
      id: product.merchant.id,
      slug: product.merchant.slug,
      name: product.merchant.name,
      logoSeed: product.merchant.logoSeed,
      originCity: product.merchant.originCity,
      originState: product.merchant.originState,
    },
  };
}
