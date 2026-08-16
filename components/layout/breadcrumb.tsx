import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localePath } from "@/lib/locale";

export type Crumb = { label: string; href?: string };

/**
 * Derived from the product's or category's own path, never from navigation
 * history — that is what keeps one canonical URL per page.
 */
export function Breadcrumb({ crumbs, locale }: { crumbs: Crumb[]; locale: string }) {
  const parent = [...crumbs].reverse().find((c) => c.href);
  return (
    <nav aria-label="Breadcrumb" className="py-2">
      {/* Mobile collapses to a single back step. */}
      {parent ? (
        <Link
          href={localePath(locale, parent.href!)}
          className="inline-flex items-center gap-1 text-small text-primary lg:hidden"
        >
          <ChevronLeft size={14} />
          {parent.label}
        </Link>
      ) : null}

      <ol className="hidden flex-wrap items-center gap-1 text-small text-muted-foreground lg:flex">
        <li>
          <Link href={localePath(locale, "/market")} className="hover:text-primary">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-subtle-foreground" />
            {crumb.href && index < crumbs.length - 1 ? (
              <Link href={localePath(locale, crumb.href)} className="hover:text-primary">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
