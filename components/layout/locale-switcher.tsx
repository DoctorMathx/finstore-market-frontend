"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { COUNTRIES, type CountryCode } from "@/lib/country";
import { swapLocale } from "@/lib/locale";
import { writeCookie } from "@/lib/cookies";
import { useCart, useMarket } from "@/components/providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Two controls for two different decisions.
 *
 * Language is cheap and reversible — swap the segment, keep path, query and
 * cart. Country is consequential — it empties the cart, so it confirms first.
 */
export function LanguageSwitcher() {
  const { locale, config } = useMarket();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  // Only the current country's languages are ever offered.
  const languages = config.languages;
  const current = languages.find((l) => l.code === locale) ?? languages[0];

  function choose(code: string) {
    setOpen(false);
    const query = search.toString();
    router.push(`${swapLocale(pathname, code)}${query ? `?${query}` : ""}`);
    writeCookie("fm_locale", code);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="tap-target flex items-center gap-1 rounded-md px-2 text-small text-chrome-foreground hover:bg-chrome-hover"
      >
        <Globe size={16} className="text-chrome-muted" />
        <span className="hidden lg:inline">{current.label}</span>
        <ChevronDown size={14} className="text-chrome-muted" />
      </button>
      {open ? (
        <div className="chrome-surface absolute right-0 top-full z-50 mt-2 w-[220px] rounded-xl border border-chrome-border bg-chrome-raised py-1 shadow-xl">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => choose(language.code)}
              disabled={!language.live}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-small text-chrome-foreground hover:bg-chrome-hover disabled:text-chrome-muted"
            >
              {language.label}
              {!language.live ? <span className="text-micro text-chrome-muted">Coming soon</span> : null}
              {language.code === current.code ? <span className="text-primary-strong">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CountrySelector() {
  const { config, locale } = useMarket();
  const { lines, clear } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<CountryCode | null>(null);

  function request(code: CountryCode) {
    if (code === config.code) return;
    setPending(code);
  }

  function confirm() {
    if (!pending) return;
    const target = COUNTRIES[pending];
    clear();
    writeCookie("fm_locale", target.languages[0].code);
    router.push(swapLocale(pathname, target.languages[0].code));
    setPending(null);
  }

  return (
    <>
      <label className="sr-only" htmlFor="country-select">
        Country
      </label>
      <select
        id="country-select"
        value={config.code}
        onChange={(e) => request(e.target.value as CountryCode)}
        className="h-11 rounded-md border border-chrome-border bg-chrome-raised px-2 text-small text-chrome-foreground"
      >
        {Object.values(COUNTRIES).map((c) => (
          <option key={c.code} value={c.code} disabled={!c.live}>
            {c.name}
            {c.live ? "" : " — coming soon"}
          </option>
        ))}
      </select>

      {/* Emptying the cart is destructive, so this is an AlertDialog: it traps
          focus and cannot be dismissed by clicking through it. */}
      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pending ? COUNTRIES[pending].name : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {pending ? COUNTRIES[pending].name : "It"} has different stores, a different currency and a different
              delivery network.
              {lines.length > 0
                ? ` Your cart (${lines.length} item${lines.length === 1 ? "" : "s"}) will be emptied.`
                : ""}{" "}
              You are currently shopping {config.name} in {locale}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="tap-target">Stay in {config.name}</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} className="tap-target">
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
