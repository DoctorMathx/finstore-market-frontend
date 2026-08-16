import { NextResponse, type NextRequest } from "next/server";

/**
 * Promo validation is server-side, always. Error copy names the actual reason —
 * "Invalid code" tells the buyer nothing and generates a support ticket.
 */
type Rule = {
  code: string;
  label: string;
  kind: "percent" | "fixed";
  value: number;
  minOrderMinor?: number;
  merchantId?: string;
  expired?: boolean;
  alreadyUsed?: boolean;
};

const RULES: Rule[] = [
  { code: "FIRST10", label: "First order — 10% off", kind: "percent", value: 10, minOrderMinor: 500_000 },
  { code: "SHIPFREE", label: "Free delivery", kind: "fixed", value: 250_000 },
  { code: "NAIJA5", label: "₦5,000 off", kind: "fixed", value: 500_000, minOrderMinor: 5_000_000 },
  { code: "EXPIRED24", label: "Expired campaign", kind: "percent", value: 20, expired: true },
  { code: "USEDONCE", label: "Already redeemed", kind: "percent", value: 15, alreadyUsed: true },
];

export async function POST(request: NextRequest) {
  const { code, itemsTotal } = (await request.json()) as { code: string; itemsTotal: number };
  const normalized = (code ?? "").trim().toUpperCase();
  const rule = RULES.find((r) => r.code === normalized);

  if (!rule) {
    return NextResponse.json(
      { ok: false, reason: `We don't have a code called "${normalized}". Check the spelling and try again.` },
      { status: 200 },
    );
  }
  if (rule.expired) {
    return NextResponse.json({ ok: false, reason: "This code expired. It ran until 31 July." });
  }
  if (rule.alreadyUsed) {
    return NextResponse.json({ ok: false, reason: "You've already used this code on a previous order." });
  }
  if (rule.minOrderMinor && itemsTotal < rule.minOrderMinor) {
    const minimum = (rule.minOrderMinor / 100).toLocaleString();
    return NextResponse.json({ ok: false, reason: `This code needs an order of ₦${minimum} or more.` });
  }

  const discount =
    rule.kind === "percent" ? Math.round((itemsTotal * rule.value) / 100) : Math.min(rule.value, itemsTotal);

  return NextResponse.json({ ok: true, code: rule.code, label: rule.label, discountMinor: discount });
}
