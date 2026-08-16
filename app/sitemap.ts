import type { MetadataRoute } from "next";
import { CATALOG, productHref } from "@/lib/data/catalog";
import { MERCHANTS } from "@/lib/data/merchants";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { HELP_TOPICS } from "@/lib/help";
import { LIVE_LOCALES } from "@/lib/locale";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://finstore.africa";

/**
 * Products are listed only while in stock. In production this is split by
 * category and regenerated nightly rather than built in one pass.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LIVE_LOCALES) {
    entries.push({ url: `${BASE}/${locale}/market`, changeFrequency: "daily", priority: 1 });

    for (const dept of DEPARTMENTS) {
      entries.push({ url: `${BASE}/${locale}/market/c/${dept.slug}`, changeFrequency: "daily", priority: 0.9 });
      // Hidden subcategories are not merchandised, so they are not indexed.
      for (const sub of dept.children ?? []) {
        if (sub.hidden) continue;
        entries.push({ url: `${BASE}/${locale}/market/c/${sub.slug}`, changeFrequency: "daily", priority: 0.8 });
      }
      entries.push({ url: `${BASE}/${locale}/market/best-sellers/${dept.slug}`, changeFrequency: "daily", priority: 0.6 });
      entries.push({ url: `${BASE}/${locale}/market/new-arrivals/${dept.slug}`, changeFrequency: "daily", priority: 0.6 });
    }

    for (const merchant of MERCHANTS) {
      entries.push({ url: `${BASE}/${locale}/market/store/${merchant.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }

    for (const topic of HELP_TOPICS) {
      entries.push({ url: `${BASE}/${locale}/market/help/${topic.slug}`, changeFrequency: "monthly", priority: 0.4 });
    }

    for (const product of CATALOG) {
      if (product.totalStock === 0) continue;
      entries.push({
        url: `${BASE}/${locale}${productHref(product)}`,
        lastModified: product.listedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
