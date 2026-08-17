"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { localePath } from "@/lib/locale";
import { useMarket, useSaved } from "@/components/providers";
import { useAddresses } from "@/lib/addresses";
import { PageContainer, ProductImage, Skeleton } from "@/components/ui";
import { CountrySelector, LanguageSwitcher } from "@/components/layout/locale-switcher";
import { DeliverToSelector } from "@/components/layout/deliver-to-selector";
import { useCardModels } from "@/components/product/recently-viewed-rail";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "addresses", label: "Addresses" },
  { id: "payment", label: "Payment" },
  { id: "preferences", label: "Preferences" },
  { id: "viewed", label: "Recently viewed" },
] as const;

export function AccountView({ locale }: { locale: string }) {
  const search = useSearchParams();
  const { user, signedIn, signOut, config } = useMarket();
  const [tab, setTab] = useState<string>(search.get("tab") ?? "profile");
  const { addresses } = useAddresses();

  return (
    <PageContainer className="py-4">
      <h1 className="mb-4 text-display">Your account</h1>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Account sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-left text-small ${
                tab === item.id ? "bg-primary-soft font-medium text-primary-strong" : "text-muted-foreground hover:bg-background-alt"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="rounded-lg border border-border bg-card p-5">
          {tab === "profile" ? (
            <section>
              <h2 className="mb-3 text-h2">Profile</h2>
              {signedIn ? (
                <>
                  <dl className="flex flex-col gap-2 text-body">
                    <div className="flex justify-between border-b border-border pb-2">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium text-foreground">{user?.name}</dd>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate font-medium text-foreground">{user?.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Country</dt>
                      <dd className="font-medium text-foreground">{config.name}</dd>
                    </div>
                  </dl>
                  <button onClick={signOut} className="mt-4 text-small font-medium text-primary-strong">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-body text-muted-foreground">
                    You are browsing as a guest. Sign in to see your orders on any device and keep your saved items.
                  </p>
                  <Link
                    href={localePath(locale, "/market/signin?returnTo=/market/account")}
                    className="tap-target mt-3 inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </section>
          ) : null}

          {tab === "addresses" ? (
            <section>
              <h2 className="mb-1 text-h2">Addresses</h2>
              <p className="mb-3 text-small text-muted-foreground">
                Saved when you check out. {config.subRegionLabel} and landmark are what get your order delivered first
                time.
              </p>
              {addresses.length ? (
                <ul className="flex flex-col gap-3">
                  {addresses.map((address, index) => (
                    <li key={index} className="rounded-lg border border-border p-3 text-body">
                      <p className="font-medium text-foreground">{address.fullName}</p>
                      <p className="text-muted-foreground">
                        {address.street}
                        {address.landmark ? `, ${address.landmark}` : ""}, {address.subRegion}, {address.region}
                      </p>
                      <p className="text-subtle-foreground">{address.phone}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-muted-foreground">No saved addresses yet.</p>
              )}
              <div className="mt-4">
                <p className="mb-1 text-small text-muted-foreground">Default delivery area</p>
                <DeliverToSelector variant="inline" />
              </div>
            </section>
          ) : null}

          {tab === "payment" ? (
            <section>
              <h2 className="mb-1 text-h2">Payment</h2>
              <p className="mb-3 text-small text-muted-foreground">Available in {config.name}, all on Fintava rails.</p>
              <ul className="flex flex-col gap-2">
                {config.paymentMethods.map((method) => (
                  <li key={method.id} className="rounded-lg border border-border p-3">
                    <p className="text-body font-medium text-foreground">{method.label}</p>
                    <p className="text-small text-muted-foreground">{method.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-small text-subtle-foreground">
                Cards are saved by our payment processor, never on Finstore.
              </p>
            </section>
          ) : null}

          {tab === "preferences" ? (
            <section>
              <h2 className="mb-3 text-h2">Preferences</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-small text-muted-foreground">Language</p>
                  <LanguageSwitcher />
                </div>
                <div>
                  <p className="mb-1 text-small text-muted-foreground">Country</p>
                  <CountrySelector />
                  <p className="mt-1 text-small text-subtle-foreground">
                    Changing country empties your cart — different stores, currency and delivery network.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "viewed" ? <RecentlyViewedGrid locale={locale} /> : null}
        </div>
      </div>
    </PageContainer>
  );
}

function RecentlyViewedGrid({ locale }: { locale: string }) {
  const { recentlyViewed } = useSaved();
  const { cards, loading } = useCardModels(recentlyViewed);

  if (!recentlyViewed.length) {
    return (
      <section>
        <h2 className="mb-1 text-h2">Recently viewed</h2>
        <p className="text-body text-muted-foreground">Nothing here yet — products you open will show up in this list.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-h2">Recently viewed</h2>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center gap-3 py-3">
              <Link
                href={localePath(locale, card.href)}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border"
              >
                <ProductImage seed={card.imageSeed} alt="" label={card.title} className="h-full w-full" />
              </Link>
              <Link href={localePath(locale, card.href)} className="min-w-0 flex-1 truncate text-small text-foreground">
                {card.title}
              </Link>
              <span className="shrink-0 text-small font-semibold text-foreground">{card.priceLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
