import type { Money } from "./money";
import type { CategoryNode } from "./taxonomy";

export type ProductImage = {
  /** Deterministic seed the placeholder renderer turns into an image. */
  seed: string;
  alt: string;
  /** Reserved now so video slots do not need a data-model change in v2. */
  kind: "image" | "video";
};

export type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: Money;
  stock: number;
  images?: string[];
};

export type MerchantSummary = {
  id: string;
  slug: string;
  name: string;
  logoSeed: string;
  /** undefined until 10 rated orders — never show a rating built on one review */
  rating?: number;
  completedOrders: number;
  originCity: string;
  originState: string;
  medianHandlingHours: number;
  verified: boolean;
  joinedYear: number;
  /** L1 category slugs this merchant stocks. */
  sells: string[];
};

export type DealKind = "standing" | "limited" | "grant";

export type Deal = {
  kind: DealKind;
  label?: string;
  /** ISO timestamp, server-supplied. Countdown never trusts the device clock. */
  endsAt?: string;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  categorySlug: string;
  categoryPath: CategoryNode[];
  images: ProductImage[];
  price: Money;
  originalPrice?: Money;
  /** Only true when the original price was genuinely live for >= 14 days. */
  originalPriceVerified: boolean;
  unitPrice?: { value: Money; unit: string };
  variants: Variant[];
  defaultVariantId?: string;
  description: string;
  keyDetails: string[];
  specs: Array<{ label: string; value: string }>;
  merchant: MerchantSummary;
  rating?: { average: number; count: number; histogram: number[] };
  packClass: PackClass;
  maxPerOrder: number;
  condition: "new" | "refurbished" | "used";
  deal?: Deal;
  listedAt: string;
  unitsSold7d: number;
  totalStock: number;
};

/**
 * Dimensional-weight band. Drives per-merchant-group delivery accumulation.
 * `digital` accrues no weight and is never quoted for delivery.
 */
export type PackClass = "digital" | "envelope" | "small" | "medium" | "large" | "bulky";

export type DeliveryQuote = {
  merchantId: string;
  cost: Money;
  estimatedDate: string;
  method: "standard" | "express";
};

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  /** Price captured at add-to-cart so we can surface changes explicitly. */
  priceAtAdd: number;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  verified: boolean;
  photos: string[];
  helpful: number;
};

export type OrderStatus =
  | "awaiting_confirmation"
  | "preparing"
  | "on_the_way"
  | "delivered"
  | "completed"
  | "cancelled"
  | "issue_raised";

export type SubOrder = {
  id: string;
  merchant: MerchantSummary;
  items: Array<{ product: Product; variantId?: string; quantity: number; unitPrice: Money }>;
  status: OrderStatus;
  delivery: DeliveryQuote;
  /** Set once delivered; drives the auto-confirm countdown. */
  deliveredAt?: string;
  riderName?: string;
  riderPhone?: string;
};

export type Order = {
  id: string;
  placedAt: string;
  subOrders: SubOrder[];
  itemsTotal: Money;
  deliveryTotal: Money;
  discount?: { label: string; amount: Money };
  total: Money;
  address: Record<string, string>;
  paymentMethod: string;
};
