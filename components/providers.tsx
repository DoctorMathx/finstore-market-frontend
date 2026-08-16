"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getCountry, type CountryConfig } from "@/lib/country";
import type { CartLine } from "@/lib/cart-types";
import { writeCookie } from "@/lib/cookies";
import { createStorageStore, useHydrated, useStorageStore } from "@/lib/client-store";

export { useOnline } from "@/lib/client-store";

/* ------------------------------------------------------------------- stores */

const userStore = createStorageStore<{ name: string; email: string } | null>("fm_user", null);
const cartStore = createStorageStore<CartLine[]>("fm_cart", []);
const savedStore = createStorageStore<string[]>("fm_saved", []);
const viewedStore = createStorageStore<string[]>("fm_viewed", []);

/* ------------------------------------------------------------------ market */

type MarketContextValue = {
  locale: string;
  config: CountryConfig;
  /** Destination for every delivery estimate on the site. */
  deliverTo: { region: string; subRegion: string };
  setDeliverTo: (value: { region: string; subRegion: string }) => void;
  signedIn: boolean;
  /** The account identity. Delivery phone lives on the address, not the account. */
  user?: { name: string; email: string };
  signIn: (user: { name: string; email: string }) => void;
  signOut: () => void;
};

const MarketContext = createContext<MarketContextValue | null>(null);

const DELIVER_TO_COOKIE = "fm_deliver_to";

export function MarketProvider({
  locale,
  initialDeliverTo,
  children,
}: {
  locale: string;
  initialDeliverTo: { region: string; subRegion: string };
  children: ReactNode;
}) {
  const config = useMemo(() => getCountry(locale.split("-")[1] ?? "NG"), [locale]);
  // The server read the cookie on this very request, so the initial value is
  // already correct — no client-side re-read needed.
  const [deliverTo, setDeliverToState] = useState(initialDeliverTo);
  const user = useStorageStore(userStore) ?? undefined;

  const setDeliverTo = useCallback((value: { region: string; subRegion: string }) => {
    setDeliverToState(value);
    writeCookie(DELIVER_TO_COOKIE, encodeURIComponent(`${value.region}|${value.subRegion}`));
  }, []);

  const signIn = useCallback((next: { name: string; email: string }) => {
    userStore.set(next);
  }, []);

  const signOut = useCallback(() => {
    userStore.set(null);
  }, []);

  const value = useMemo<MarketContextValue>(
    () => ({ locale, config, deliverTo, setDeliverTo, signedIn: Boolean(user), user, signIn, signOut }),
    [locale, config, deliverTo, setDeliverTo, user, signIn, signOut],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}

/* -------------------------------------------------------------------- cart */

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  merchantCount: number;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  remove: (productId: string, variantId: string | undefined) => void;
  restore: (line: CartLine, index: number) => void;
  clear: () => void;
  lastAdded?: CartLine;
  clearLastAdded: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartLine, productId: string, variantId?: string) {
  return a.productId === productId && a.variantId === variantId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useStorageStore(cartStore);
  const hydrated = useHydrated();
  const [lastAdded, setLastAdded] = useState<CartLine | undefined>();

  const add = useCallback((line: CartLine) => {
    cartStore.set((prev) => {
      const existing = prev.findIndex((l) => sameLine(l, line.productId, line.variantId));
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = {
          ...next[existing],
          quantity: Math.min(next[existing].quantity + line.quantity, line.maxPerOrder),
        };
        return next;
      }
      return [...prev, line];
    });
    setLastAdded(line);
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | undefined, quantity: number) => {
    cartStore.set((prev) =>
      prev.map((l) => (sameLine(l, productId, variantId) ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string | undefined) => {
    cartStore.set((prev) => prev.filter((l) => !sameLine(l, productId, variantId)));
  }, []);

  const restore = useCallback((line: CartLine, index: number) => {
    cartStore.set((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, line);
      return next;
    });
  }, []);

  const clear = useCallback(() => cartStore.set([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      merchantCount: new Set(lines.map((l) => l.merchant.id)).size,
      add,
      setQuantity,
      remove,
      restore,
      clear,
      lastAdded,
      clearLastAdded: () => setLastAdded(undefined),
    }),
    [lines, hydrated, add, setQuantity, remove, restore, clear, lastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/* ------------------------------------------------------------------- saved */

type SavedContextValue = {
  saved: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  recentlyViewed: string[];
  recordView: (id: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const saved = useStorageStore(savedStore);
  const recentlyViewed = useStorageStore(viewedStore);

  const toggle = useCallback((id: string) => {
    savedStore.set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const recordView = useCallback((id: string) => {
    viewedStore.set((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 20));
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({ saved, isSaved: (id) => saved.includes(id), toggle, recentlyViewed, recordView }),
    [saved, recentlyViewed, toggle, recordView],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}

/* ------------------------------------------------------------------ toasts */

export type Toast = {
  id: number;
  message: string;
  tone?: "default" | "danger";
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.duration ?? 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
