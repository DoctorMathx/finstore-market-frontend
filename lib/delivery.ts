import { money } from "./money";
import type { DeliveryQuote, MerchantSummary, PackClass } from "./types";

/**
 * Delivery is quoted per merchant group, never blended. Two items from one
 * merchant ship together and cost less than the same two items from two
 * merchants — the cart shows this explicitly so buyers learn to consolidate.
 */

const PACK_UNITS: Record<PackClass, number> = {
  digital: 0,
  envelope: 1,
  small: 2,
  medium: 5,
  large: 12,
  bulky: 25,
};

const ZONES: Record<string, string[]> = {
  "South West": ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"],
  "South East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  "South South": ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"],
  "North Central": ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "Abuja (FCT)"],
  "North East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  "North West": ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"],
};

function zoneOf(state: string): string {
  for (const [zone, states] of Object.entries(ZONES)) {
    if (states.includes(state)) return zone;
  }
  return "North Central";
}

type Leg = "same-state" | "same-zone" | "cross-country";

function legFor(origin: string, destination: string): Leg {
  if (origin === destination) return "same-state";
  return zoneOf(origin) === zoneOf(destination) ? "same-zone" : "cross-country";
}

const BASE_COST: Record<Leg, number> = {
  "same-state": 1_500,
  "same-zone": 2_500,
  "cross-country": 3_800,
};

const PER_UNIT_COST: Record<Leg, number> = {
  "same-state": 120,
  "same-zone": 190,
  "cross-country": 280,
};

const TRANSIT_DAYS: Record<Leg, number> = {
  "same-state": 1,
  "same-zone": 2,
  "cross-country": 4,
};

export type QuoteInput = {
  merchant: MerchantSummary;
  /** One entry per cart line: pack class and quantity. */
  lines: { packClass: PackClass; quantity: number }[];
  destinationState: string;
  method?: "standard" | "express";
};

export function quoteDelivery({
  merchant,
  lines,
  destinationState,
  method = "standard",
}: QuoteInput): DeliveryQuote {
  // Nothing in the group ships, so there is nothing to quote.
  if (lines.length && lines.every((l) => l.packClass === "digital")) {
    return { merchantId: merchant.id, cost: money(0, "NGN"), estimatedDate: new Date().toISOString(), method };
  }

  const leg = legFor(merchant.originState, destinationState);

  // Dimensional-weight units accumulate across the group, with a volume
  // discount — consolidation is the behaviour we want to reward.
  const units = lines.reduce((sum, l) => sum + PACK_UNITS[l.packClass] * l.quantity, 0);
  const billableUnits = units <= 2 ? units : 2 + (units - 2) * 0.65;

  let amount = BASE_COST[leg] + billableUnits * PER_UNIT_COST[leg];
  if (method === "express") amount *= 1.6;

  const handlingDays = Math.ceil(merchant.medianHandlingHours / 24);
  const transitDays = method === "express" ? Math.max(1, TRANSIT_DAYS[leg] - 1) : TRANSIT_DAYS[leg];

  return {
    merchantId: merchant.id,
    cost: money(Math.round((amount * 100) / 5000) * 5000, "NGN"),
    estimatedDate: addBusinessDays(new Date(), handlingDays + transitDays).toISOString(),
    method,
  };
}

/**
 * A single-unit estimate for cards and the PDP buy box. Only ever rendered when
 * we have a real destination — a fake promise is worse than no promise.
 */
export function estimateArrival(
  merchant: MerchantSummary,
  destinationState: string,
  packClass: PackClass,
): DeliveryQuote {
  return quoteDelivery({ merchant, lines: [{ packClass, quantity: 1 }], destinationState });
}

export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) remaining -= 1; // riders work Saturdays, not Sundays
  }
  return date;
}

export function formatDeliveryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

/** "Next day" / "2–3 days" bucket, derived rather than merchant-declared. */
export function speedBucket(iso: string): "next-day" | "2-3-days" | "slower" {
  const days = Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
  if (days <= 1) return "next-day";
  if (days <= 3) return "2-3-days";
  return "slower";
}
