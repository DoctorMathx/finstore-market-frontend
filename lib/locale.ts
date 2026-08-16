import { COUNTRIES, getCountry, type CountryConfig, type LocaleCode } from "./country";

export const DEFAULT_LOCALE: LocaleCode = "en-NG";

/** Every locale the router will accept, live or not. */
export const ALL_LOCALES: LocaleCode[] = Object.values(COUNTRIES).flatMap((c) =>
  c.languages.map((l) => l.code),
);

/** Locales we actually emit hreflang for and offer in the switcher. */
export const LIVE_LOCALES: LocaleCode[] = Object.values(COUNTRIES)
  .filter((c) => c.live)
  .flatMap((c) => c.languages.filter((l) => l.live).map((l) => l.code));

export function isKnownLocale(value: string): boolean {
  return ALL_LOCALES.includes(value);
}

export function countryCodeFromLocale(locale: string): string {
  return locale.split("-")[1] ?? "NG";
}

export function languageFromLocale(locale: string): string {
  return locale.split("-")[0] ?? "en";
}

export function configForLocale(locale: string): CountryConfig {
  return getCountry(countryCodeFromLocale(locale));
}

/** Build a locale-prefixed path. Accepts paths with or without a leading slash. */
export function localePath(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Swap only the locale segment, preserving the rest of the path and all query
 * state. Language changes must feel instant and lossless.
 */
export function swapLocale(pathname: string, nextLocale: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && isKnownLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }
  return `/${nextLocale}${pathname}`;
}

/** Resolve a country from an Accept-Language / IP hint, defaulting to Nigeria. */
export function resolveLocaleFromHints(acceptLanguage?: string | null): LocaleCode {
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const tag = part.split(";")[0].trim();
      if (isKnownLocale(tag)) return tag;
      const region = tag.split("-")[1];
      if (region) {
        const country = COUNTRIES[region.toUpperCase() as keyof typeof COUNTRIES];
        if (country?.live) return country.languages[0].code;
      }
    }
  }
  return DEFAULT_LOCALE;
}
