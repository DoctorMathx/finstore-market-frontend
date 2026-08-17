"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { localePath } from "@/lib/locale";
import { useMarket } from "@/components/providers";

export function AccountMenu({ locale }: { locale: string }) {
  const { signedIn, user, signOut } = useMarket();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close when the route changes. Derived during render, not an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Entries that need auth deep-link to sign-in with a returnTo rather than
  // being hidden — hiding them means the buyer never learns they exist.
  const authHref = (path: string) =>
    signedIn ? localePath(locale, path) : localePath(locale, `/market/signin?returnTo=${encodeURIComponent(path)}`);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="tap-target flex items-center gap-1 rounded-md px-2 text-left hover:bg-chrome-hover"
      >
        <span className="hidden leading-tight sm:block">
          <span className="block text-micro text-chrome-muted">{signedIn ? "Hello," : "Hello, sign in"}</span>
          <span className="block text-small font-semibold text-chrome-foreground">
            {signedIn ? user?.name.split(" ")[0] : "Account"}
          </span>
        </span>
        <span className="text-small font-semibold text-chrome-foreground sm:hidden">Account</span>
        <ChevronDown size={14} className="text-chrome-muted" />
      </button>

      {open ? (
        <div
          role="menu"
          className="chrome-surface absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-chrome-border bg-chrome-raised p-4 shadow-xl"
        >
          {signedIn ? (
            <>
              <p className="text-body font-semibold text-chrome-foreground">Hello, {user?.name.split(" ")[0]}</p>
              <p className="truncate text-small text-chrome-muted">{user?.email}</p>
              <div className="my-3 grid grid-cols-2 gap-x-4 border-t border-chrome-border pt-3">
                <div>
                  <p className="mb-1 text-micro uppercase tracking-wide text-chrome-muted">Your lists</p>
                  <MenuLink href={localePath(locale, "/market/wishlist")}>Saved items</MenuLink>
                  <MenuLink href={localePath(locale, "/market/account?tab=viewed")}>Recently viewed</MenuLink>
                </div>
                <div>
                  <p className="mb-1 text-micro uppercase tracking-wide text-chrome-muted">Your account</p>
                  <MenuLink href={localePath(locale, "/market/orders")}>Your orders</MenuLink>
                  <MenuLink href={localePath(locale, "/market/account")}>Addresses</MenuLink>
                  <MenuLink href={localePath(locale, "/market/account?tab=payment")}>Payment</MenuLink>
                  <MenuLink href={localePath(locale, "/market/account?tab=preferences")}>Preferences</MenuLink>
                  <MenuLink href={localePath(locale, "/market/help")}>Help</MenuLink>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className="w-full border-t border-chrome-border pt-3 text-left text-small font-medium text-primary-strong"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href={localePath(locale, "/market/signin")}
                className="tap-target flex w-full items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Sign in
              </Link>
              <p className="mt-2 text-center text-small text-chrome-muted">
                New here?{" "}
                <Link href={localePath(locale, "/market/signin?mode=create")} className="font-medium text-primary-strong">
                  Create an account
                </Link>
              </p>
              <div className="mt-3 border-t border-chrome-border pt-3">
                <MenuLink href={authHref("/market/orders")}>Your orders</MenuLink>
                <MenuLink href={authHref("/market/wishlist")}>Saved items</MenuLink>
                <MenuLink href={localePath(locale, "/market/help")}>Help</MenuLink>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="block py-1.5 text-small text-muted-foreground hover:text-primary-strong">
      {children}
    </Link>
  );
}
