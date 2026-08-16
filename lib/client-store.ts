"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-side persistent state, done the way React wants it done.
 *
 * Everything here is a `useSyncExternalStore` source rather than a
 * read-localStorage-in-an-effect: the server snapshot is the initial value, the
 * client snapshot is the stored one, and React reconciles the two at hydration
 * without a cascading second render. Cross-tab writes are picked up via the
 * `storage` event, which the effect-based version silently missed.
 */

type Listener = () => void;

export type StorageStore<T> = {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T | ((previous: T) => T)) => void;
};

export function createStorageStore<T>(
  key: string,
  initial: T,
  area: "local" | "session" = "local",
): StorageStore<T> {
  const listeners = new Set<Listener>();
  // Snapshot identity must be stable between reads, so the parsed value is
  // cached and only invalidated by our own writes or a cross-tab event.
  let cached: T = initial;
  let loaded = false;

  const storage = () => (area === "local" ? window.localStorage : window.sessionStorage);

  function read(): T {
    try {
      const raw = storage().getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      // A corrupt entry is never worth blocking the session over.
      return initial;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      // Another tab writing the same key invalidates our cache.
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          loaded = false;
          emit();
        }
      };
      if (area === "local") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (area === "local") window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      if (!loaded) {
        cached = read();
        loaded = true;
      }
      return cached;
    },
    getServerSnapshot() {
      return initial;
    },
    set(next) {
      const value = typeof next === "function" ? (next as (p: T) => T)(this.getSnapshot()) : next;
      cached = value;
      loaded = true;
      try {
        storage().setItem(key, JSON.stringify(value));
      } catch {
        // Quota errors degrade to in-memory state rather than throwing mid-action.
      }
      emit();
    },
  };
}

export function useStorageStore<T>(store: StorageStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const noopSubscribe = () => () => {};

/**
 * False during SSR and the hydration render, true after. The canonical way to
 * gate client-only UI without a `setMounted` effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolledPast(threshold: number): boolean {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("scroll", listener, { passive: true });
      return () => window.removeEventListener("scroll", listener);
    },
    () => window.scrollY > threshold,
    () => false,
  );
}

/** Connectivity as an external store — the textbook useSyncExternalStore case. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("online", listener);
      window.addEventListener("offline", listener);
      return () => {
        window.removeEventListener("online", listener);
        window.removeEventListener("offline", listener);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
