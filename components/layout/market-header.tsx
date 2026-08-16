"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, Package, X } from "lucide-react";
import { NAV_BAR_CATEGORIES } from "@/lib/taxonomy";
import { localePath } from "@/lib/locale";
import { useCart, useMarket } from "@/components/providers";
import { SearchBar } from "@/components/discovery/search-bar";
import { NavDrawer } from "./nav-drawer";
import { AccountMenu } from "./account-menu";
import { DeliverToSelector } from "./deliver-to-selector";
import { LanguageSwitcher } from "./locale-switcher";
import { FinstoreWordmark } from "@/components/brand/finstore-logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { createStorageStore, useScrolledPast, useStorageStore } from "@/lib/client-store";

/** Dismissal lasts the session — the bar comes back on the next visit. */
const trustBarStore = createStorageStore<boolean>("fm_trustbar_dismissed", false, "session");

export function MarketHeader({ locale }: { locale: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Collapse to rows 1 + 3 after 200px so the CTA-adjacent chrome stays lean.
  const collapsed = useScrolledPast(200);
  const trustBarDismissed = useStorageStore(trustBarStore);
  const { itemCount, hydrated } = useCart();
  const { signedIn } = useMarket();
  const pathname = usePathname();

  // Drawer state never survives navigation. Derived during render, not an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  // The header's height varies — trust bar is dismissible, the category row
  // collapses on scroll, and the mobile stack wraps. Publishing the measured
  // height as a CSS variable lets every sticky element sit exactly below it
  // instead of guessing with a hardcoded offset.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const publish = () =>
      document.documentElement.style.setProperty("--header-h", `${node.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cartBadge = hydrated && itemCount > 0 ? itemCount : null;

  return (
    <>
      <header ref={headerRef} className="chrome-surface sticky top-0 z-50 border-b border-chrome-border">
        {/* Row 1 */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-2 lg:flex-row lg:items-center lg:gap-4 lg:px-6 lg:py-0">
          <div className="flex items-center gap-2 lg:h-14">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="tap-target -ml-2 flex items-center justify-center rounded-md text-chrome-foreground hover:bg-chrome-hover lg:hidden"
            >
              <Menu size={22} />
            </button>

            <Link
              href={localePath(locale, "/market")}
              aria-label="Finstore Market home"
              className="flex shrink-0 items-center rounded-md py-1 pr-2"
            >
              <FinstoreWordmark size={30} priority />
            </Link>

            <div className="hidden lg:block">
              <DeliverToSelector />
            </div>

            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <ThemeToggle />
              <Link
                href={localePath(locale, "/market/cart")}
                aria-label={`Cart, ${cartBadge ?? 0} items`}
                className="tap-target relative flex items-center justify-center rounded-md text-chrome-foreground"
              >
                <ShoppingCart size={22} />
                {cartBadge ? <CartBadge count={cartBadge} /> : null}
              </Link>
            </div>
          </div>

          <div className="flex-1 lg:py-2.5">
            <SearchBar locale={locale} />
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            <ThemeToggle />
            <LanguageSwitcher />
            <AccountMenu locale={locale} />
            <Link
              href={localePath(locale, signedIn ? "/market/orders" : "/market/signin?returnTo=/market/orders")}
              className="tap-target flex items-center gap-1.5 rounded-md px-2 hover:bg-chrome-hover"
            >
              <Package size={18} className="text-chrome-muted" />
              <span className="leading-tight">
                <span className="block text-micro text-chrome-muted">Returns</span>
                <span className="block text-small font-semibold text-chrome-foreground">& Orders</span>
              </span>
            </Link>
            <Link
              href={localePath(locale, "/market/cart")}
              className="tap-target relative flex items-center gap-1.5 rounded-md px-2 hover:bg-chrome-hover"
            >
              <span className="relative">
                <ShoppingCart size={22} className="text-chrome-foreground" />
                {cartBadge ? <CartBadge count={cartBadge} /> : null}
              </span>
              <span className="text-small font-semibold text-chrome-foreground">Cart</span>
            </Link>
          </div>

          {/* Mobile deliver-to sits under the search field, always visible. */}
          <div className="lg:hidden">
            <DeliverToSelector variant="inline" />
          </div>
        </div>

        {/* Row 2 — category bar, collapses on scroll */}
        <div
          className={`hidden overflow-hidden border-t border-chrome-border bg-chrome-raised transition-all duration-200 lg:block ${
            collapsed ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1 overflow-x-auto px-6 [scrollbar-width:none]">
            <button
              onClick={() => setDrawerOpen(true)}
              className="tap-target flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-small font-medium text-chrome-foreground hover:bg-chrome-hover"
            >
              <Menu size={16} />
              All categories
            </button>
            {NAV_BAR_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={localePath(locale, `/market/c/${category.slug}`)}
                className="tap-target flex items-center whitespace-nowrap rounded-md px-2 text-small text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground"
              >
                {category.label}
              </Link>
            ))}
            {/* Promo slot — rendered only when a real campaign is live. */}
            <NavPromoSlot locale={locale} />
          </div>
        </div>

        {/* Row 3 — trust bar. Names the mechanism; never says "escrow". */}
        {!trustBarDismissed ? (
          <div className="border-t border-chrome-border bg-primary/10">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-2 px-6 py-1.5">
              <p className="text-small text-primary">
                Every order protected. The store is paid only after you receive your item.
              </p>
              <button
                onClick={() => trustBarStore.set(true)}
                aria-label="Dismiss"
                className="ml-2 text-primary hover:text-primary"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <NavDrawer locale={locale} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-micro font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** An empty or filler slot is worse than no slot, so this returns null by default. */
function NavPromoSlot({ locale }: { locale: string }) {
  const campaign = { live: true, label: "SMEDAN grant prices — shop the programme", href: "/market/deals" };
  if (!campaign.live) return null;
  return (
    <Link
      href={localePath(locale, campaign.href)}
      className="tap-target ml-auto hidden items-center whitespace-nowrap rounded-md px-2 text-small font-medium text-primary hover:bg-chrome-hover xl:flex"
    >
      {campaign.label}
    </Link>
  );
}
