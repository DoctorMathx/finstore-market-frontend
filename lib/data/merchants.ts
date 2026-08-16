import type { MerchantSummary } from "../types";

type Seed = {
  name: string;
  city: string;
  state: string;
  orders: number;
  rating?: number;
  handling: number;
  verified: boolean;
  joined: number;
  /** L1 slugs this merchant plausibly stocks. A car-parts store listing
   *  iPhones reads as fake instantly, so the catalog respects this. */
  sells: string[];
};

const SEEDS: Seed[] = [
  { name: "Okin Import Hub", city: "Ibadan", state: "Oyo", orders: 1240, rating: 4.7, handling: 24, verified: true, joined: 2022, sells: ["phones-electronics", "power-energy"] },
  { name: "Merchant Cheena", city: "Lagos", state: "Lagos", orders: 3180, rating: 4.5, handling: 12, verified: true, joined: 2021, sells: ["fashion-apparel", "bags-luggage", "footwear"] },
  { name: "Balogun Wholesale", city: "Lagos", state: "Lagos", orders: 5420, rating: 4.4, handling: 18, verified: true, joined: 2021, sells: ["fashion-apparel", "fabric-textiles", "home-kitchen"] },
  { name: "Ada's Beauty Corner", city: "Enugu", state: "Enugu", orders: 860, rating: 4.8, handling: 20, verified: true, joined: 2023, sells: ["beauty-personal-care", "hair-wigs", "jewelry-watches"] },
  { name: "Kano Tech Plaza", city: "Kano", state: "Kano", orders: 1980, rating: 4.2, handling: 36, verified: true, joined: 2022, sells: ["phones-electronics", "power-energy"] },
  { name: "Aba Made Clothing", city: "Aba", state: "Abia", orders: 2410, rating: 4.6, handling: 30, verified: true, joined: 2022, sells: ["fashion-apparel", "footwear", "baby-kids"] },
  { name: "Wuse Electronics", city: "Abuja", state: "Abuja (FCT)", orders: 1120, rating: 4.3, handling: 24, verified: true, joined: 2023, sells: ["phones-electronics", "home-kitchen", "power-energy"] },
  { name: "Port Harcourt Provisions", city: "Port Harcourt", state: "Rivers", orders: 740, rating: 4.5, handling: 16, verified: true, joined: 2023, sells: ["food-groceries", "home-kitchen"] },
  { name: "Ogbomosho Farm Supply", city: "Ogbomosho", state: "Oyo", orders: 310, rating: 4.4, handling: 40, verified: true, joined: 2024, sells: ["agriculture", "food-groceries"] },
  { name: "Yaba Gadgets", city: "Lagos", state: "Lagos", orders: 4260, rating: 4.6, handling: 8, verified: true, joined: 2020, sells: ["phones-electronics", "power-energy"] },
  { name: "Nnewi Auto Parts", city: "Nnewi", state: "Anambra", orders: 1560, rating: 4.1, handling: 30, verified: true, joined: 2022, sells: ["automotive", "building-hardware"] },
  { name: "Kaduna Home Store", city: "Kaduna", state: "Kaduna", orders: 620, rating: 4.3, handling: 26, verified: false, joined: 2024, sells: ["home-kitchen", "furniture"] },
  { name: "Benin Fabrics", city: "Benin City", state: "Edo", orders: 980, rating: 4.7, handling: 22, verified: true, joined: 2023, sells: ["fabric-textiles", "fashion-apparel", "hair-wigs"] },
  { name: "Ikorodu Kids World", city: "Lagos", state: "Lagos", orders: 450, rating: 4.2, handling: 28, verified: true, joined: 2024, sells: ["baby-kids", "footwear", "books-stationery"] },
  { name: "Jos Books & Stationery", city: "Jos", state: "Plateau", orders: 190, rating: 4.5, handling: 34, verified: false, joined: 2024, sells: ["books-stationery", "art-crafts"] },
  // Deliberately under 10 rated orders — renders as "New merchant", never a rating.
  { name: "Warri Fresh Goods", city: "Warri", state: "Delta", orders: 6, handling: 24, verified: false, joined: 2026, sells: ["food-groceries", "agriculture"] },
  { name: "Abeokuta Building Depot", city: "Abeokuta", state: "Ogun", orders: 830, rating: 4.4, handling: 44, verified: true, joined: 2023, sells: ["building-hardware", "furniture", "home-kitchen"] },
  { name: "Lagos Creative Studio", city: "Lagos", state: "Lagos", orders: 410, rating: 4.8, handling: 4, verified: true, joined: 2023, sells: ["services-digital"] },
  { name: "Skillup NG", city: "Abuja", state: "Abuja (FCT)", orders: 260, rating: 4.6, handling: 2, verified: true, joined: 2024, sells: ["services-digital", "books-stationery"] },
  { name: "Surulere Sports", city: "Lagos", state: "Lagos", orders: 540, rating: 4.3, handling: 20, verified: true, joined: 2024, sells: ["sports-fitness", "footwear", "health-wellness"] },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const MERCHANTS: MerchantSummary[] = SEEDS.map((s, i) => ({
  id: `m_${String(i + 1).padStart(3, "0")}`,
  slug: slugify(s.name),
  name: s.name,
  logoSeed: s.name,
  rating: s.orders >= 10 ? s.rating : undefined,
  completedOrders: s.orders,
  originCity: s.city,
  originState: s.state,
  medianHandlingHours: s.handling,
  verified: s.verified,
  joinedYear: s.joined,
  sells: s.sells,
}));

export function merchantBySlug(slug: string): MerchantSummary | undefined {
  return MERCHANTS.find((m) => m.slug === slug);
}

export function merchantById(id: string): MerchantSummary | undefined {
  return MERCHANTS.find((m) => m.id === id);
}

/** Merchants whose rating is established — new-arrivals is gated on this. */
export function isEstablished(m: MerchantSummary): boolean {
  return m.rating !== undefined && m.completedOrders >= 100;
}
