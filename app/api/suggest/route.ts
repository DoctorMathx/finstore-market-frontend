import { NextResponse, type NextRequest } from "next/server";
import { CATALOG, productHref } from "@/lib/data/catalog";
import { DEPARTMENTS, visibleSubcategories } from "@/lib/taxonomy";
import { getCountry } from "@/lib/country";
import { formatMoney } from "@/lib/money";

/**
 * Typeahead has three zones: query completions, matching categories, and up to
 * three product hits with a thumbnail seed and a formatted price.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const locale = request.nextUrl.searchParams.get("locale") ?? "en-NG";
  const scope = request.nextUrl.searchParams.get("cat") ?? "";
  const config = getCountry(locale.split("-")[1] ?? "NG");

  if (q.length < 2) {
    return NextResponse.json({ completions: [], categories: [], products: [] });
  }

  const categories = [...DEPARTMENTS, ...visibleSubcategories()]
    .filter((c) => c.label.toLowerCase().includes(q))
    .slice(0, 4)
    .map((c) => ({ slug: c.slug, label: c.label, level: c.level }));

  const pool = scope ? CATALOG.filter((p) => p.categoryPath.some((c) => c.slug === scope)) : CATALOG;
  const matches = pool.filter((p) => p.title.toLowerCase().includes(q));

  const completions = [
    ...new Set(
      matches
        .map((p) => `${p.brand ?? ""} ${p.categoryPath[2]?.label ?? ""}`.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 6);

  const products = matches
    .sort((a, b) => b.unitsSold7d - a.unitsSold7d)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      title: p.title,
      href: productHref(p),
      imageSeed: p.images[0].seed,
      price: formatMoney(p.price, config),
    }));

  return NextResponse.json({ completions, categories, products, total: matches.length });
}
