"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, X, Globe } from "lucide-react";
import { DEPARTMENTS, type CategoryNode } from "@/lib/taxonomy";
import { localePath } from "@/lib/locale";
import { useMarket } from "@/components/providers";

/**
 * One drawer for both breakpoints. A hover mega-menu has timing problems,
 * cannot hold a three-level tree, and needs a separate mobile build anyway.
 */
export function NavDrawer({
  locale,
  open,
  onClose,
}: {
  locale: string;
  open: boolean;
  onClose: () => void;
}) {
  const { signedIn, user, config } = useMarket();
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const [showAllL1, setShowAllL1] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Each opening starts from the top-level panel. Derived during render.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStack([]);
      setShowAllL1(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  const current = stack[stack.length - 1];
  const departments = showAllL1 ? DEPARTMENTS : DEPARTMENTS.slice(0, 6);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
      // `inert` (not just aria-hidden) also removes the closed drawer's ~30
      // links from the tab order — pointer-events only stops the mouse.
      inert={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Browse Finstore Market"
        className={`absolute left-0 top-0 flex h-full w-[88vw] max-w-[320px] flex-col bg-card transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
          <span className="text-h2 text-primary-foreground">
            {signedIn ? `Hello, ${user?.name.split(" ")[0]}` : "Hello, sign in"}
          </span>
          <button onClick={onClose} aria-label="Close menu" className="tap-target -mr-2 flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Panel 1 */}
          <nav
            className={`absolute inset-0 overflow-y-auto transition-transform duration-200 ${
              current ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <DrawerSection title="Trending">
              <DrawerLink href={localePath(locale, "/market/deals")}>Deals</DrawerLink>
              <DrawerLink href={localePath(locale, "/market/best-sellers")}>Best sellers</DrawerLink>
              <DrawerLink href={localePath(locale, "/market/new-arrivals")}>New arrivals</DrawerLink>
            </DrawerSection>

            <DrawerSection title="Shop by category">
              {departments.map((node) => (
                <button
                  key={node.slug}
                  onClick={() => setStack([node])}
                  className="tap-target flex w-full items-center justify-between px-4 py-3 text-left text-body text-foreground hover:bg-background-alt"
                >
                  {node.label}
                  <ChevronRight size={16} className="text-subtle-foreground" />
                </button>
              ))}
              {!showAllL1 ? (
                <button
                  onClick={() => setShowAllL1(true)}
                  className="tap-target flex w-full items-center gap-1 px-4 py-3 text-left text-body font-medium text-primary-strong hover:bg-background-alt"
                >
                  See all {DEPARTMENTS.length} departments
                </button>
              ) : null}
            </DrawerSection>

            <DrawerSection title="Your account">
              <DrawerLink href={localePath(locale, "/market/orders")}>Your orders</DrawerLink>
              <DrawerLink href={localePath(locale, "/market/wishlist")}>Saved items</DrawerLink>
              <DrawerLink href={localePath(locale, "/market/account")}>Addresses</DrawerLink>
            </DrawerSection>

            <DrawerSection title="Help & settings">
              <div className="flex items-center gap-2 px-4 py-3 text-body text-foreground">
                <Globe size={16} className="text-subtle-foreground" />
                {config.languages[0].label} · {config.name}
              </div>
              <DrawerLink href={localePath(locale, "/market/help")}>Help</DrawerLink>
              {/* Market is a shop window for merchant acquisition, so this is not footer-only. */}
              <DrawerLink href={localePath(locale, "/market/help/sell-on-finstore")}>Sell on Finstore</DrawerLink>
              {signedIn ? null : <DrawerLink href={localePath(locale, "/market/signin")}>Sign in</DrawerLink>}
            </DrawerSection>
          </nav>

          {/* Panels 2 and 3 */}
          {current ? (
            <nav className="absolute inset-0 translate-x-0 overflow-y-auto bg-card transition-transform duration-200">
              <button
                onClick={() => setStack((s) => s.slice(0, -1))}
                className="tap-target flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left text-body font-medium text-foreground"
              >
                <ChevronLeft size={16} />
                {stack.length > 1 ? stack[stack.length - 2].label : "Main menu"}
              </button>
              <p className="px-4 pb-1 pt-4 text-micro uppercase tracking-wide text-subtle-foreground">{current.label}</p>
              <Link
                href={localePath(locale, `/market/c/${current.slug}`)}
                className="tap-target flex w-full items-center px-4 py-3 text-body font-medium text-primary-strong hover:bg-background-alt"
              >
                See all in {current.label}
              </Link>
              {(current.children ?? []).map((child) =>
                child.children?.length ? (
                  <button
                    key={child.slug}
                    onClick={() => setStack((s) => [...s, child])}
                    className="tap-target flex w-full items-center justify-between px-4 py-3 text-left text-body text-foreground hover:bg-background-alt"
                  >
                    {child.label}
                    <ChevronRight size={16} className="text-subtle-foreground" />
                  </button>
                ) : (
                  <DrawerLink key={child.slug} href={localePath(locale, `/market/c/${child.slug}`)}>
                    {child.label}
                  </DrawerLink>
                ),
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2">
      <p className="px-4 pb-1 pt-2 text-micro uppercase tracking-wide text-subtle-foreground">{title}</p>
      {children}
    </div>
  );
}

function DrawerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tap-target flex w-full items-center px-4 py-3 text-body text-foreground hover:bg-background-alt">
      {children}
    </Link>
  );
}
