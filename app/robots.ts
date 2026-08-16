import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://finstore.africa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Transactional and personal surfaces are never indexed.
        disallow: [
          "/*/market/cart",
          "/*/market/checkout",
          "/*/market/account",
          "/*/market/orders",
          "/*/market/wishlist",
          "/*/market/signin",
          "/*/market/search",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
