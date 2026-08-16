import { NextResponse, type NextRequest } from "next/server";
import { productById } from "@/lib/data/catalog";
import { merchantById } from "@/lib/data/merchants";
import { quoteDelivery } from "@/lib/delivery";
import { getCountry } from "@/lib/country";
import type { CartLine, CartValidation } from "@/lib/cart-types";

/**
 * Stock and price are re-validated on cart load. The client never decides what
 * something costs, and delivery is quoted per merchant group using dimensional
 * weight accumulated across that group's lines.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { lines: CartLine[]; destinationState?: string; locale?: string };
  const config = getCountry((body.locale ?? "en-NG").split("-")[1] ?? "NG");
  const destinationState = body.destinationState ?? config.defaultRegion;

  const lines = (body.lines ?? []).map((line) => {
    const product = productById(line.productId);
    if (!product) {
      return { productId: line.productId, variantId: line.variantId, currentPrice: line.priceAtAdd, stock: 0, available: false };
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    const stock = variant?.stock ?? product.totalStock;
    return {
      productId: line.productId,
      variantId: line.variantId,
      currentPrice: variant?.price.amount ?? product.price.amount,
      stock,
      available: stock > 0,
    };
  });

  const byMerchant = new Map<string, CartLine[]>();
  for (const line of body.lines ?? []) {
    const validated = lines.find((l) => l.productId === line.productId && l.variantId === line.variantId);
    if (!validated?.available) continue;
    const group = byMerchant.get(line.merchant.id) ?? [];
    group.push(line);
    byMerchant.set(line.merchant.id, group);
  }

  const groups = [...byMerchant.entries()].flatMap(([merchantId, groupLines]) => {
    const merchant = merchantById(merchantId);
    if (!merchant) return [];
    const quote = quoteDelivery({
      merchant,
      lines: groupLines.map((l) => ({ packClass: l.packClass, quantity: l.quantity })),
      destinationState,
    });
    return [{ merchantId, deliveryCost: quote.cost.amount, estimatedDate: quote.estimatedDate }];
  });

  const payload: CartValidation = { lines, groups };
  return NextResponse.json(payload);
}
