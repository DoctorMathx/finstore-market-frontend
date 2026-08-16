import type { PackClass } from "./types";

/**
 * The cart stores a snapshot of what it needs to render, not a product
 * reference. Prices and stock are re-validated against the server on cart load,
 * which is how price changes and stock-outs get surfaced explicitly.
 */
export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  title: string;
  href: string;
  imageSeed: string;
  variantLabel?: string;
  /** minor units, captured at add-to-cart */
  priceAtAdd: number;
  currency: "NGN" | "GHS" | "KES" | "ZAR";
  packClass: PackClass;
  maxPerOrder: number;
  merchant: {
    id: string;
    slug: string;
    name: string;
    originCity: string;
    originState: string;
    logoSeed: string;
  };
};

export type ValidatedLine = {
  productId: string;
  variantId?: string;
  currentPrice: number;
  stock: number;
  available: boolean;
};

export type ValidatedGroup = {
  merchantId: string;
  deliveryCost: number;
  estimatedDate: string;
};

export type CartValidation = {
  lines: ValidatedLine[];
  groups: ValidatedGroup[];
};
