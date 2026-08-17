import Link from "next/link";
import { localePath } from "@/lib/locale";
import { getCountry } from "@/lib/country";
import { CountrySelector } from "./locale-switcher";
import { FinstoreWordmark } from "@/components/brand/finstore-logo";

const COLUMNS = [
  {
    title: "Buy on Finstore",
    links: [
      ["How it works", "/market/help/how-it-works"],
      ["Delivery", "/market/help/delivery"],
      ["Returns & refunds", "/market/help/returns"],
      ["Payment methods", "/market/help/payments"],
      ["Track an order", "/market/orders"],
    ],
  },
  {
    title: "Sell on Finstore",
    links: [
      ["Open a free store", "/market/help/sell-on-finstore"],
      ["Join Market", "/market/help/join-market"],
      ["Merchant help", "/market/help/merchant-help"],
      ["Fees", "/market/help/fees"],
    ],
  },
  {
    title: "Finstore",
    links: [
      ["About", "/market/help/about"],
      ["Careers", "/market/help/careers"],
      ["Press", "/market/help/press"],
      ["Blog", "/market/help/blog"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Contact", "/market/help/contact"],
      ["WhatsApp support", "/market/help/whatsapp"],
      ["FAQ", "/market/help"],
      ["Report a listing", "/market/help/report"],
    ],
  },
] as const;

export function MarketFooter({ locale }: { locale: string }) {
  const config = getCountry(locale.split("-")[1] ?? "NG");
  return (
    <footer className="chrome-surface mt-12 border-t border-chrome-border pb-[var(--tabbar-h)] lg:pb-0">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 lg:px-6">
        <div className="mb-8">
          <FinstoreWordmark size={28} />
          <p className="mt-2 max-w-sm text-small text-chrome-muted">
            The shared shopfront for Finstore merchants. Every order is protected — the store is paid only after you
            confirm delivery.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="mb-3 text-small font-semibold text-chrome-foreground">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={localePath(locale, href)} className="text-small text-chrome-muted hover:text-primary-strong">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-chrome-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-small text-chrome-muted">Country</span>
            <CountrySelector />
          </div>
          <p className="text-small text-chrome-muted">
            Shopping in {config.name} · Prices in {config.currency.code}
          </p>
        </div>
      </div>

      <div className="border-t border-chrome-border bg-chrome-raised">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-5 text-micro text-chrome-muted lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <p>
            {config.legalEntity} · Payments powered by Fintava · Banking services provided by Loma Bank, licensed by the
            Central Bank of Nigeria.
          </p>
          <p className="flex gap-4">
            <Link href={localePath(locale, "/market/help/terms")} className="hover:text-primary-strong">
              Terms
            </Link>
            <Link href={localePath(locale, "/market/help/privacy")} className="hover:text-primary-strong">
              Privacy
            </Link>
            <span>© {new Date().getFullYear()} Finstore</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
