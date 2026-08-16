import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import "../globals.css";
import { ALL_LOCALES, isKnownLocale, languageFromLocale } from "@/lib/locale";
import { getCountry } from "@/lib/country";
import { CartProvider, MarketProvider, SavedProvider, ToastProvider } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketHeader } from "@/components/layout/market-header";
import { MarketFooter } from "@/components/layout/market-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { ToastViewport } from "@/components/feedback/toast-viewport";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { AddToCartPanelHost } from "@/components/cart/add-to-cart-panel";

const inter = Inter({
  // latin-ext carries the naira sign (U+20A6). Without it ₦ falls back to a
  // system font and renders with stray crossbars at display sizes — on a
  // marketplace where every price starts with it, that is not cosmetic.
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://finstore.africa";

export const metadata: Metadata = {
  // Absolute canonical/OG URLs resolve against this instead of localhost.
  metadataBase: new URL(SITE_URL),
  title: "Finstore Market",
  description:
    "Buy from verified Nigerian merchants. Every order is protected — the store is paid only after you confirm delivery.",
  icons: { icon: "/brand/favicon.ico", apple: "/brand/finstore-logo.png" },
  openGraph: {
    siteName: "Finstore Market",
    type: "website",
  },
  // X and most in-app browsers read this; the image itself comes from the
  // opengraph-image file conventions.
  twitter: { card: "summary_large_image" },
};

// The chrome is black in both themes, so the browser UI colour never changes.
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return ALL_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isKnownLocale(locale)) notFound();

  const config = getCountry(locale.split("-")[1] ?? "NG");

  // Deliver-to survives before login via a cookie; default is the country's own.
  const store = await cookies();
  const cookieValue = store.get("fm_deliver_to")?.value;
  const [region, subRegion] = cookieValue
    ? decodeURIComponent(cookieValue).split("|")
    : [config.defaultRegion, config.defaultSubRegion];

  return (
    // suppressHydrationWarning: next-themes writes the theme class before paint.
    <html lang={languageFromLocale(locale)} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          // Dark is the brand default, matching finstore.africa.
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <MarketProvider
            locale={locale}
            initialDeliverTo={{
              region: region ?? config.defaultRegion,
              subRegion: subRegion ?? config.defaultSubRegion,
            }}
          >
            <TooltipProvider delayDuration={200}>
              <ToastProvider>
                <SavedProvider>
                  <CartProvider>
                    <a
                      href="#main"
                      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                    >
                      Skip to content
                    </a>
                    <OfflineBanner />
                    <MarketHeader locale={locale} />
                    <main id="main" className="pb-20 lg:pb-10">
                      {children}
                    </main>
                    <MarketFooter locale={locale} />
                    <MobileTabBar locale={locale} />
                    <AddToCartPanelHost locale={locale} />
                    <ToastViewport />
                  </CartProvider>
                </SavedProvider>
              </ToastProvider>
            </TooltipProvider>
          </MarketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
