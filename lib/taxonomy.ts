/**
 * The global category tree, mirroring the backend.
 *
 * Two levels, not three: departments contain subcategories, and only a
 * subcategory can be assigned to a product. The tree is read-only here —
 * merchants pick from it at listing time and never free-text a category.
 *
 * `productCount` is the live backend figure. It is carried for merchandising
 * and ordering; displayed listing counts always come from the actual result
 * set, never from this number.
 *
 * `hidden` subcategories exist in the tree but are not merchandised: they stay
 * out of navigation, tiles, search and the sitemap.
 */

export type FacetKey =
  | "price"
  | "brand"
  | "condition"
  | "rating"
  | "shipsFrom"
  | "delivery"
  | "discount"
  | "size"
  | "colour"
  | "storage"
  | "capacity"
  | "weight";

export type CategoryNode = {
  id: string;
  slug: string;
  label: string;
  level: 1 | 2;
  parentSlug?: string;
  productCount: number;
  hidden?: boolean;
  /** Which filters render on this node's PLP. Price and brand are universal. */
  facetSchema?: FacetKey[];
  children?: CategoryNode[];
  /** Department only. */
  icon?: string;
  /** Department only — nothing here ships, so delivery is not quoted. */
  digital?: boolean;
};

const BASE: FacetKey[] = ["price", "brand", "rating", "shipsFrom", "delivery", "discount"];
const APPAREL: FacetKey[] = [...BASE, "size", "colour"];

type RawDepartment = {
  slug: string;
  label: string;
  icon: string;
  count: number;
  facets?: FacetKey[];
  digital?: boolean;
  /** [slug, label, productCount, hidden?] */
  children: [string, string, number, boolean?][];
};

const RAW: RawDepartment[] = [
  {
    slug: "fashion-apparel",
    label: "Fashion & Apparel",
    icon: "shirt",
    count: 10_732,
    facets: APPAREL,
    children: [
      ["womens-tops", "Women's Tops", 1462],
      ["dresses-gowns", "Dresses & Gowns", 2127],
      ["womens-bottoms", "Women's Bottoms", 1237],
      ["two-piece-sets", "Two-Piece & Co-ord Sets", 1075],
      ["mens-clothing", "Men's Clothing", 1217],
      ["unisex-clothing", "Unisex Clothing", 979],
      ["outerwear-blazers", "Outerwear & Blazers", 346],
      ["traditional-native-wear", "Traditional & Native Wear", 476],
      ["underwear-sleepwear", "Underwear & Sleepwear", 600],
      ["thrift-preloved", "Thrift & Preloved", 103],
      ["eyewear-sunglasses", "Eyewear & Sunglasses", 366],
      ["fashion-accessories", "Fashion Accessories", 744],
    ],
  },
  {
    slug: "footwear",
    label: "Footwear",
    icon: "footprints",
    count: 3434,
    facets: APPAREL,
    children: [
      ["womens-shoes", "Women's Shoes & Heels", 852],
      ["mens-shoes", "Men's Shoes", 314],
      ["sneakers", "Sneakers & Trainers", 452],
      ["slippers-sandals", "Slippers, Slides & Sandals", 1349],
      ["kids-shoes", "Kids' Shoes", 271],
      ["unisex-footwear", "Unisex & Other Footwear", 196],
    ],
  },
  {
    slug: "bags-luggage",
    label: "Bags & Luggage",
    icon: "bag",
    count: 3839,
    facets: [...BASE, "colour"],
    children: [
      ["handbags-totes", "Handbags & Totes", 3224],
      ["backpacks-school-bags", "Backpacks & School Bags", 257],
      ["travel-luggage", "Travel Bags & Luggage", 192],
      ["wallets-purses", "Wallets, Purses & Pouches", 97],
      ["mens-bags", "Men's Bags", 69],
    ],
  },
  {
    slug: "fabric-textiles",
    label: "Fabric & Textiles",
    icon: "fabric",
    count: 514,
    facets: [...BASE, "colour", "weight"],
    children: [
      ["mens-fabric", "Men's Fabric (Senator, Agbada, Cashmere)", 76],
      ["lace-ankara-aso-ebi", "Lace, Ankara & Aso-Ebi", 345],
      ["net-chiffon-lining", "Net, Chiffon & Lining", 65],
      ["sewing-supplies", "Sewing Supplies & Trims", 28],
    ],
  },
  {
    slug: "hair-wigs",
    label: "Hair & Wigs",
    icon: "hair",
    count: 3202,
    facets: [...BASE, "colour"],
    children: [
      ["human-hair-wigs", "Human Hair Wigs", 1548],
      ["braided-synthetic-wigs", "Braided & Synthetic Wigs", 178],
      ["hair-bundles-closures", "Bundles, Closures & Frontals", 187],
      ["hair-care-treatments", "Hair Care & Treatments", 364],
      ["hair-tools-styling", "Hair Tools & Styling", 428],
      ["hair-accessories", "Hair Accessories", 497],
    ],
  },
  {
    slug: "beauty-personal-care",
    label: "Beauty & Personal Care",
    icon: "sparkles",
    count: 10_543,
    children: [
      ["perfume-cologne", "Perfume & Cologne", 2296],
      ["arabic-oud-fragrance", "Arabic & Oud Fragrance", 1620],
      ["body-mist-spray", "Body Mist & Body Spray", 664],
      ["perfume-oils-rollons", "Perfume Oils & Roll-Ons", 419],
      ["skincare-face", "Skincare — Face", 1790],
      ["body-care-lotions", "Body Care & Lotions", 1634],
      ["makeup", "Makeup", 608],
      ["lip-care", "Lip Care", 13],
      ["nail-care", "Nail Care", 85],
      ["oral-personal-hygiene", "Oral & Personal Hygiene", 365],
      ["mens-grooming", "Men's Grooming", 25],
      ["cosmetic-packaging-materials", "Cosmetic Packaging & Raw Materials", 352],
      ["beauty-tools", "Beauty Tools & Accessories", 672],
    ],
  },
  {
    slug: "jewelry-watches",
    label: "Jewelry & Watches",
    icon: "watch",
    count: 4835,
    facets: [...BASE, "colour"],
    children: [
      ["necklaces-pendants", "Necklaces & Pendants", 919],
      ["earrings", "Earrings", 776],
      ["bracelets-anklets", "Bracelets & Anklets", 797],
      ["rings", "Rings", 281],
      ["watches", "Watches", 1154],
      ["jewelry-sets", "Jewelry Sets", 798],
      ["jewelry-storage", "Jewelry Storage & Care", 110],
    ],
  },
  {
    slug: "home-kitchen",
    label: "Home & Kitchen",
    icon: "lamp",
    count: 9315,
    facets: [...BASE, "colour", "capacity"],
    children: [
      ["cookware-pots", "Cookware & Pots", 730],
      ["kitchen-utensils", "Kitchen Utensils & Gadgets", 1623],
      ["small-kitchen-appliances", "Small Kitchen Appliances", 1472],
      ["cookers-ovens-hobs", "Cookers, Ovens & Hobs", 352],
      ["food-storage-flasks", "Food Storage, Flasks & Serveware", 1655],
      ["home-appliances", "Home Appliances", 383],
      ["cleaning-laundry", "Cleaning & Laundry", 524],
      ["pest-control", "Pest Control", 37],
      ["air-care-home-fragrance", "Air Care & Home Fragrance", 287],
      ["bathroom-accessories", "Bathroom Accessories", 380],
      ["bedding-towels-linen", "Bedding, Towels & Linen", 351],
      ["home-decor", "Home Décor", 867],
      ["storage-organisation", "Storage & Organisation", 654],
    ],
  },
  {
    slug: "furniture",
    label: "Furniture",
    icon: "sofa",
    count: 510,
    facets: [...BASE, "colour"],
    children: [
      ["beds-mattresses", "Beds & Mattresses", 49],
      ["wardrobes-storage-furniture", "Wardrobes & Storage Furniture", 72],
      ["sofas-living-room", "Sofas & Living Room", 168],
      ["tables-chairs", "Tables & Chairs", 167],
      ["office-furniture", "Office Furniture", 54],
    ],
  },
  {
    slug: "power-energy",
    label: "Power & Energy",
    icon: "bolt",
    count: 1808,
    facets: [...BASE, "capacity"],
    children: [
      ["rechargeable-fans", "Rechargeable Fans", 571],
      ["power-banks-chargers", "Power Banks & Chargers", 309],
      ["solar-panels-kits", "Solar Panels & Solar Kits", 218],
      ["inverters-batteries", "Inverters & Batteries", 173],
      ["generators", "Generators", 31],
      ["rechargeable-lights", "Rechargeable Lights & Lamps", 410],
      ["gas-cylinders-burners", "Gas Cylinders & Accessories", 96],
    ],
  },
  {
    slug: "phones-electronics",
    label: "Phones & Electronics",
    icon: "smartphone",
    count: 2834,
    facets: [...BASE, "condition", "storage", "colour"],
    children: [
      ["phones", "Phones & Tablets", 579],
      ["phone-accessories", "Phone Accessories", 681],
      ["laptops-computing", "Laptops & Computing", 320],
      ["audio-speakers", "Audio & Speakers", 333],
      ["tv-entertainment", "TV & Home Entertainment", 129],
      ["cameras-content-creation", "Cameras & Content Creation", 623],
      ["smartwatches-wearables", "Smartwatches & Wearables", 169],
    ],
  },
  {
    slug: "health-wellness",
    label: "Health & Wellness",
    icon: "heart",
    count: 2714,
    children: [
      ["supplements-vitamins", "Supplements & Vitamins", 742],
      ["sexual-wellness", "Sexual Wellness", 463],
      ["medical-supplies", "Medical Supplies & First Aid", 531],
      ["fitness-weight-management", "Fitness & Weight Management", 366],
      ["herbal-remedies", "Herbal & Traditional Remedies", 579],
      ["smoking-vaping", "Smoking & Vaping Accessories", 33],
    ],
  },
  {
    slug: "food-groceries",
    label: "Food & Groceries",
    icon: "basket",
    count: 3191,
    facets: [...BASE, "weight"],
    children: [
      ["provisions-packaged-foods", "Provisions & Packaged Foods", 631],
      ["snacks-confectionery", "Snacks & Confectionery", 279],
      ["beverages", "Beverages", 384],
      ["fresh-produce", "Fresh Produce & Foodstuff", 442],
      ["meat-fish-poultry", "Meat, Fish & Poultry", 243],
      ["bakery-prepared-food", "Bakery & Prepared Food", 762],
      ["spices-oils-condiments", "Spices, Oils & Condiments", 450],
    ],
  },
  {
    slug: "agriculture",
    label: "Agriculture & Farming",
    icon: "sprout",
    count: 197,
    facets: [...BASE, "weight"],
    children: [
      ["seedlings-seeds", "Seedlings, Seeds & Suckers", 34],
      ["livestock-poultry", "Livestock & Poultry", 105],
      ["animal-feed", "Animal Feed", 30],
      ["fertiliser-agrochemicals", "Fertiliser & Agrochemicals", 10],
      ["farm-tools-equipment", "Farm Tools & Equipment", 18],
    ],
  },
  {
    slug: "baby-kids",
    label: "Baby & Kids",
    icon: "baby",
    count: 1485,
    facets: APPAREL,
    children: [
      ["baby-food-formula", "Baby Food & Formula", 32],
      ["kids-clothing", "Kids' Clothing", 1026],
      ["toys-ride-ons", "Toys & Ride-Ons", 128],
      ["baby-care-hygiene", "Baby Care & Hygiene", 172],
      ["kids-school-supplies", "Kids' School Supplies", 127],
    ],
  },
  {
    slug: "automotive",
    label: "Automotive",
    icon: "car",
    count: 463,
    facets: [...BASE, "condition"],
    children: [
      ["engine-transmission-parts", "Engine & Transmission Parts", 247],
      ["vehicles", "Vehicles", 40],
      ["truck-heavy-duty-parts", "Truck & Heavy Duty Parts", 16],
      ["car-accessories-care", "Car Accessories & Care", 120],
      ["tyres-batteries-fluids", "Tyres, Batteries & Fluids", 40],
    ],
  },
  {
    slug: "services-digital",
    label: "Services & Digital",
    icon: "monitor",
    count: 839,
    digital: true,
    facets: ["price", "brand", "rating", "discount"],
    children: [
      ["web-software-services", "Web & Software Services", 246],
      ["design-printing", "Design & Printing", 141],
      ["photography-videography", "Photography & Videography", 45],
      ["ebooks-downloads", "Ebooks & Digital Downloads", 106],
      ["courses-training", "Courses & Training", 101],
      ["events-bookings", "Events & Bookings", 200],
    ],
  },
  {
    slug: "building-hardware",
    label: "Building & Hardware",
    icon: "hammer",
    count: 305,
    children: [
      ["doors-windows", "Doors & Windows", 63, true],
      ["tiles-flooring", "Tiles & Flooring", 25, true],
      ["plumbing-fittings", "Plumbing & Fittings", 31, true],
      ["paint-finishes", "Paint & Finishes", 74, true],
      ["tools-hardware", "Tools & Hardware", 112, true],
    ],
  },
  {
    slug: "sports-fitness",
    label: "Sports & Fitness",
    icon: "dumbbell",
    count: 394,
    facets: APPAREL,
    children: [
      ["sportswear", "Sportswear", 57, true],
      ["team-jerseys", "Team Jerseys", 218, true],
      ["gym-equipment", "Gym Equipment", 37, true],
      ["sports-accessories", "Sports Accessories", 82, true],
    ],
  },
  {
    slug: "books-stationery",
    label: "Books & Stationery",
    icon: "book",
    count: 323,
    children: [
      ["books", "Books", 152, true],
      ["office-supplies", "Office Supplies", 82, true],
      ["school-stationery", "School Stationery", 89, true],
    ],
  },
  {
    slug: "art-crafts",
    label: "Art & Crafts",
    icon: "palette",
    count: 551,
    children: [
      ["resin-mould-supplies", "Resin & Mould Supplies", 138, true],
      ["crochet-yarn", "Crochet & Yarn", 29, true],
      ["handmade-decor", "Handmade Décor", 115, true],
      ["gifts-souvenirs", "Gifts & Souvenirs", 269, true],
    ],
  },
];

function build(): CategoryNode[] {
  return RAW.map((dept) => {
    const facets = dept.facets ?? BASE;
    const children = dept.children.map(([slug, label, count, hidden]) => ({
      id: slug,
      slug,
      label,
      level: 2 as const,
      parentSlug: dept.slug,
      productCount: count,
      hidden: hidden ?? false,
      facetSchema: facets,
    }));
    return {
      id: dept.slug,
      slug: dept.slug,
      label: dept.label,
      level: 1 as const,
      productCount: dept.count,
      icon: dept.icon,
      digital: dept.digital,
      facetSchema: facets,
      // A department every one of whose subcategories is hidden is itself hidden.
      hidden: children.every((c) => c.hidden),
      children,
    };
  });
}

export const TAXONOMY: CategoryNode[] = build();

const INDEX = new Map<string, CategoryNode>();
const PARENTS = new Map<string, string | undefined>();
for (const dept of TAXONOMY) {
  INDEX.set(dept.slug, dept);
  PARENTS.set(dept.slug, undefined);
  for (const sub of dept.children ?? []) {
    INDEX.set(sub.slug, sub);
    PARENTS.set(sub.slug, dept.slug);
  }
}

export function findCategory(slug: string): CategoryNode | undefined {
  return INDEX.get(slug);
}

/** Department → subcategory. Drives breadcrumbs; derived, never from history. */
export function categoryPath(slug: string): CategoryNode[] {
  const path: CategoryNode[] = [];
  let current: string | undefined = slug;
  while (current) {
    const node = INDEX.get(current);
    if (!node) break;
    path.unshift(node);
    current = PARENTS.get(current);
  }
  return path;
}

/** Subcategories under a node — the only level a product can be assigned to. */
export function subcategoriesUnder(slug: string): string[] {
  const node = INDEX.get(slug);
  if (!node) return [];
  if (node.level === 2) return [node.slug];
  return (node.children ?? []).map((child) => child.slug);
}

export function allSubcategories(): CategoryNode[] {
  return [...INDEX.values()].filter((n) => n.level === 2);
}

/** Subcategories that are actually merchandised to buyers. */
export function visibleSubcategories(): CategoryNode[] {
  return allSubcategories().filter((n) => !n.hidden);
}

export function isHidden(slug: string): boolean {
  return Boolean(INDEX.get(slug)?.hidden);
}

export function facetsFor(slug: string): FacetKey[] {
  return INDEX.get(slug)?.facetSchema ?? BASE;
}

export function isDigital(slug: string): boolean {
  const path = categoryPath(slug);
  return Boolean(path[0]?.digital);
}

/** Departments buyers can navigate to, largest catalog first. */
export const DEPARTMENTS: CategoryNode[] = TAXONOMY.filter((d) => !d.hidden).sort(
  (a, b) => b.productCount - a.productCount,
);

/** Departments surfaced directly in the desktop category bar. */
export const NAV_BAR_CATEGORIES = DEPARTMENTS.slice(0, 7);
