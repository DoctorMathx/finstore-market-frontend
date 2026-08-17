"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localePath } from "@/lib/locale";
import { DiscountBadge, ProductImage } from "@/components/ui";

/**
 * The homepage hero: a rail of merchandising cards, each backed by real
 * products, in place of a rotating banner. A carousel shows one message at a
 * time on its own schedule; a rail shows five at once on the buyer's.
 */

export type HeroCardProduct = {
  href: string;
  imageSeed: string;
  title: string;
  discountPercent?: number;
};

export type HeroCard = {
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel: string;
  href: string;
  tint: "orange" | "sky" | "rose" | "emerald" | "slate";
  /** Exactly four — the 2×2 grid is the card's proof that the offer is real. */
  products?: HeroCardProduct[];
};

/**
 * Decorative panel tints, not foundational surfaces — each pair is tuned for
 * both themes so the headline stays at body-text contrast on top of it.
 */
const TINTS: Record<HeroCard["tint"], string> = {
  orange: "bg-orange-100 dark:bg-orange-950/45",
  sky: "bg-sky-100 dark:bg-sky-950/45",
  rose: "bg-rose-100 dark:bg-rose-950/45",
  emerald: "bg-emerald-100 dark:bg-emerald-950/45",
  slate: "bg-slate-200 dark:bg-slate-900/60",
};

export function HeroCardRail({ cards, locale }: { cards: HeroCard[]; locale: string }) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section aria-label="Featured collections" className="relative">
      <div
        ref={railRef}
        className="rail -mx-4 scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10"
      >
        {cards.map((card, cardIndex) => (
          <article
            key={card.title}
            className={`flex w-[300px] shrink-0 snap-start flex-col rounded-xl p-5 sm:w-[330px] ${TINTS[card.tint]}`}
          >
            {card.eyebrow ? (
              <p className="text-small font-semibold text-muted-foreground">{card.eyebrow}</p>
            ) : null}
            <h2 className="mt-1 text-[25px] font-bold leading-[1.16] tracking-[-0.02em] text-foreground">
              {card.title}
            </h2>
            {card.body ? <p className="mt-1.5 text-small text-muted-foreground">{card.body}</p> : null}

            {card.products ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {card.products.map((product, index) => (
                  <Link
                    key={product.href}
                    href={localePath(locale, product.href)}
                    aria-label={product.title}
                    className="group relative overflow-hidden rounded-lg bg-product-canvas ring-1 ring-black/5 dark:ring-white/10"
                  >
                    <span className="block aspect-square transition-transform duration-200 group-hover:scale-105">
                      <ProductImage
                        seed={product.imageSeed}
                        alt=""
                        label={product.title}
                        priority={cardIndex < 2 && index < 4}
                        className="h-full w-full"
                      />
                    </span>
                    {product.discountPercent ? (
                      <span className="absolute bottom-1.5 left-1.5">
                        <DiscountBadge percent={product.discountPercent} />
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link
              href={localePath(locale, card.href)}
              className="mt-auto inline-flex items-center gap-1 pt-4 text-small font-semibold text-primary-strong hover:underline"
            >
              {card.ctaLabel}
              <ChevronRight size={15} />
            </Link>
          </article>
        ))}
      </div>

      {/* Paging arrows — desktop only; mobile swipes the rail natively. */}
      <button
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll collections left"
        className="absolute -left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:border-border-strong lg:flex"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => scrollByPage(1)}
        aria-label="Scroll collections right"
        className="absolute -right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:border-border-strong lg:flex"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  );
}
