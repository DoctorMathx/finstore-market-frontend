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
          <div key={card.id} className="w-[46vw] max-w-[220px] shrink-0 snap-start lg:w-auto lg:max-w-none">
            <ProductCard card={card} locale={locale} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryTiles({
  categories,
  locale,
}: {
  categories: { slug: string; label: string; icon?: string }[];
  locale: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={localePath(locale, `/market/c/${category.slug}`)}
          className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/50 hover:bg-card-hover"
        >
          <span className="flex h-20 w-full items-center justify-center rounded-lg bg-secondary text-4xl transition-transform group-hover:scale-110">
            {ICONS[category.icon ?? ""] ?? "🛒"}
          </span>
          <span className="text-small leading-5 text-foreground group-hover:text-primary">{category.label}</span>
        </Link>
      ))}
    </div>
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
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-small text-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}

const ICONS: Record<string, string> = {
  shirt: "👗",
  footprints: "👟",
  bag: "👜",
  fabric: "🧵",
  hair: "💇🏾‍♀️",
  sparkles: "💄",
  watch: "⌚",
  lamp: "🍳",
  sofa: "🛋️",
  bolt: "🔋",
  smartphone: "📱",
  heart: "💊",
  basket: "🧺",
  sprout: "🌱",
  baby: "🧸",
  car: "🚗",
  monitor: "💻",
  hammer: "🔨",
  dumbbell: "🏋️",
  book: "📚",
  palette: "🎨",
};
