"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { localePath } from "@/lib/locale";
import { useCart } from "@/components/providers";

export function MobileTabBar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();

  const tabs = [
    { href: "/market", label: "Home", icon: Home, exact: true },
    { href: "/market/c/fashion-apparel", label: "Categories", icon: LayoutGrid, match: "/market/c/" },
    { href: "/market/cart", label: "Cart", icon: ShoppingCart, badge: hydrated ? itemCount : 0 },
    { href: "/market/orders", label: "Orders", icon: Package },
    { href: "/market/account", label: "Account", icon: User },
  ];

  return (
    <nav
      aria-label="Main"
      className="chrome-surface fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-chrome-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map((tab) => {
        const href = localePath(locale, tab.href);
        const active = tab.exact ? pathname === href : pathname.startsWith(localePath(locale, tab.match ?? tab.href));
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-0.5 text-micro ${
              active ? "text-primary" : "text-chrome-muted"
            }`}
          >
            <span className="relative">
              <Icon size={20} />
              {tab.badge ? (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-micro font-semibold text-primary-foreground">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              ) : null}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
