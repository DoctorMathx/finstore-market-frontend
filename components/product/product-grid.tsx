import Link from "next/link";
import type { CardModel } from "@/lib/card";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { localePath } from "@/lib/locale";
import { SectionHeading } from "@/components/ui";

export function ProductGrid({
  cards,
  locale,
  ranked = false,
  columns = "plp",
}: {
  cards: CardModel[];
  locale: string;
  ranked?: boolean;
  columns?: "plp" | "wide";
}) {
  const cols =
    columns === "plp"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  return (
    <div className={`grid gap-4 ${cols}`}>
      {cards.map((card, index) => (
        <ProductCard
          key={card.id}
          card={card}
          locale={locale}
          rank={ranked ? index + 1 : undefined}
          priority={index < 4}
        />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Horizontal scroll on mobile, 6-up grid on desktop. Used for every homepage
 * and PDP rail so a rail never re-implements card layout.
 */
export function ProductRail({
  cards,
  locale,
  title,
  href,
  subtitle,
  linkLabel,
}: {
  cards: CardModel[];
  locale: string;
  title?: string;
  href?: string;
  subtitle?: string;
  linkLabel?: string;
}) {
  if (!cards.length) return null;
  return (
    <section>
      {title ? (
        <SectionHeading
          title={title}
          subtitle={subtitle}
          href={href ? localePath(locale, href) : undefined}
          linkLabel={linkLabel}
        />
      ) : null}
      <div className="rail -mx-4 px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0">
        {cards.slice(0, 12).map((card, index) => (
          <div key={card.id} className="w-40 shrink-0 snap-start sm:w-44 lg:w-auto">
            <ProductCard card={card} locale={locale} priority={index < 2} variant="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Subcategory shortcuts on a department page. Text only — see SubcategoryRow. */
export function SubcategoryRow({
  categories,
  locale,
}: {
  categories: { slug: string; label: string; productCount?: number }[];
  locale: string;
}) {
  if (!categories.length) return null;
  return (
    <nav aria-label="Subcategories" className="mb-6 flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={localePath(locale, `/market/c/${category.slug}`)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-small text-foreground transition-colors hover:border-primary/60 hover:text-primary-strong"
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}

