import Link from "next/link";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { localePath } from "@/lib/locale";

/**
 * Category tabs across the top of a merchandising surface. Deals filters in
 * place with a query param; best-sellers and new-arrivals get their own
 * indexable per-category route.
 */
export function CategoryTabs({
  basePath,
  locale,
  activeSlug,
  useQueryParam = false,
}: {
  basePath: string;
  locale: string;
  activeSlug?: string;
  useQueryParam?: boolean;
}) {
  const href = (slug?: string) => {
    if (!slug) return localePath(locale, basePath);
    return localePath(locale, useQueryParam ? `${basePath}?cat=${slug}` : `${basePath}/${slug}`);
  };

  return (
    <nav aria-label="Categories" className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
      <Tab href={href()} active={!activeSlug}>
        All
      </Tab>
      {DEPARTMENTS.map((category) => (
        <Tab key={category.slug} href={href(category.slug)} active={activeSlug === category.slug}>
          {category.label}
        </Tab>
      ))}
    </nav>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-small ${
        active ? "border-primary bg-primary-soft font-medium text-primary-strong" : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
