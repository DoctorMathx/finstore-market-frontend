import type { CountryConfig, CurrencyCode } from "./country";

/** All amounts are integers in minor units. Never a float, never a string. */
export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export function money(amount: number, currency: CurrencyCode = "NGN"): Money {
  return { amount: Math.round(amount), currency };
}

/** Convenience for authoring mock data in major units. */
export function naira(major: number): Money {
  return { amount: Math.round(major * 100), currency: "NGN" };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Refusing to add ${a.currency} to ${b.currency} — currency is never converted.`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function multiplyMoney(m: Money, factor: number): Money {
  return { amount: Math.round(m.amount * factor), currency: m.currency };
}

export function sumMoney(items: Money[], currency: CurrencyCode): Money {
  return items.reduce<Money>((acc, m) => addMoney(acc, m), { amount: 0, currency });
}

export function isZero(m: Money): boolean {
  return m.amount === 0;
}

/**
 * The serializable half of a country's currency rules — everything a client
 * component needs to format, without shipping the whole config across the
 * server boundary.
 */
export type MoneyFormat = {
  code: CurrencyCode;
  symbol: string;
  minorUnits: number;
  showMinor: boolean;
};

export function moneyFormat(config: CountryConfig): MoneyFormat {
  return { ...config.currency };
}

/**
 * The single render-boundary formatter. No component writes a currency symbol
 * as a literal, and no amount is ever converted between currencies for display.
 */
export function formatMoney(m: Money, config: CountryConfig): string {
  return formatMoneyWith(m, config.currency);
}

export function formatMoneyWith(m: Money, format: MoneyFormat): string {
  if (m.currency !== format.code) {
    // A price the buyer cannot actually pay must never be silently converted.
    // Render it in its own currency with an explicit ISO code instead.
    return `${m.currency} ${formatNumber(m.amount, 2, true)}`;
  }
  const { symbol, minorUnits, showMinor } = format;
  const hasMinor = m.amount % 10 ** minorUnits !== 0;
  const withDecimals = showMinor || hasMinor;
  return `${symbol}${formatNumber(m.amount, minorUnits, withDecimals)}`;
}

function formatNumber(minor: number, minorUnits: number, withDecimals: boolean): string {
  const value = minor / 10 ** minorUnits;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: withDecimals ? minorUnits : 0,
    maximumFractionDigits: withDecimals ? minorUnits : 0,
  });
}

/** Whole-percent discount off the original price, as a positive integer. */
export function discountPercent(price: Money, originalPrice?: Money): number | null {
  if (!originalPrice || originalPrice.currency !== price.currency) return null;
  if (originalPrice.amount <= price.amount) return null;
  return Math.round(((originalPrice.amount - price.amount) / originalPrice.amount) * 100);
}
