"use client";

import { createStorageStore, useHydrated, useStorageStore } from "./client-store";

/** Saved delivery addresses, written at checkout and read back everywhere. */
export type SavedAddress = Record<string, string>;

const addressesStore = createStorageStore<SavedAddress[]>("fm_addresses", []);

export function useAddresses(): { addresses: SavedAddress[]; hydrated: boolean } {
  const addresses = useStorageStore(addressesStore);
  const hydrated = useHydrated();
  return { addresses, hydrated };
}

/** Most-recent-first, deduped by phone, capped so the picker stays scannable. */
export function rememberAddress(address: SavedAddress): void {
  addressesStore.set((existing) =>
    [address, ...existing.filter((a) => a.phone !== address.phone)].slice(0, 4),
  );
}
