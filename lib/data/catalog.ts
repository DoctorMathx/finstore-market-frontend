import { money, naira } from "../money";
import { allSubcategories, categoryPath, findCategory, isDigital, subcategoriesUnder } from "../taxonomy";
import type { Deal, PackClass, Product, Review, Variant } from "../types";
import { MERCHANTS } from "./merchants";
import { PHOTO_POOLS } from "./photo-manifest";

/**
 * Deterministic mock catalog. Generated once per process from a stable seed so
 * every render — server or client — agrees on the same data.
 */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, list: readonly T[]): T {
  return list[Math.floor(r() * list.length)];
}

function pickSome<T>(r: () => number, list: readonly T[], count: number): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  }
  return out;
}

function between(r: () => number, min: number, max: number): number {
  return min + r() * (max - min);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Profile = {
  brands: string[];
  price: [number, number];
  packClass: PackClass;
  axes: ("colour" | "size" | "storage" | "capacity" | "weight")[];
  unit?: string;
};

const COLOURS = ["Black", "White", "Blue", "Silver", "Gold", "Green", "Red", "Grey"];
const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44"];
const STORAGE = ["64GB", "128GB", "256GB", "512GB"];
const GROCERY_WEIGHTS = ["1kg", "5kg", "10kg", "25kg", "50kg"];
const CAPACITY = ["1.5HP", "2HP", "2.5HP", "3HP"];

const PROFILES: Record<string, Profile> = {
  "fashion-apparel": {
    brands: ["Aba Made", "Grey Velvet", "Zaron Style", "House of Deola", "Ruff n Tumble", "Nkwo", "Orange Culture"],
    price: [2_500, 95_000],
    packClass: "small",
    axes: ["colour", "size"],
  },
  footwear: {
    brands: ["Nike", "Adidas", "Puma", "Aba Made", "Clarks", "Zara Style", "Palladium"],
    price: [3_000, 140_000],
    packClass: "medium",
    axes: ["size", "colour"],
  },
  "bags-luggage": {
    brands: ["Michael Kors", "Aba Made", "Guess", "Zara Style", "Samsonite", "Coach"],
    price: [4_000, 320_000],
    packClass: "medium",
    axes: ["colour"],
  },
  "fabric-textiles": {
    brands: ["Vlisco", "Hollandais", "ABC Wax", "Da Viva", "Aso-Oke House", "Getzner"],
    price: [3_500, 220_000],
    packClass: "medium",
    axes: ["colour", "weight"],
    unit: "yard",
  },
  "hair-wigs": {
    brands: ["Darling", "Brazilian Hair Co", "Lush Hair", "X-Pression", "Virgin Luxe", "Cantu"],
    price: [2_500, 480_000],
    packClass: "small",
    axes: ["colour"],
  },
  "beauty-personal-care": {
    brands: ["Nivea", "Dudu Osun", "Zaron", "Maybelline", "Shea Moisture", "Lattafa", "Armaf", "Oriflame"],
    price: [1_200, 180_000],
    packClass: "small",
    axes: ["size"],
  },
  "jewelry-watches": {
    brands: ["Casio", "Curren", "Xuping", "Naira Gold", "Fossil", "Seiko"],
    price: [2_000, 420_000],
    packClass: "envelope",
    axes: ["colour"],
  },
  "home-kitchen": {
    brands: ["Tower", "Master Chef", "Prestige", "Binatone", "Scanfrost", "Royal Home", "Vitro"],
    price: [2_500, 480_000],
    packClass: "medium",
    axes: ["colour", "capacity"],
  },
  furniture: {
    brands: ["Mouka", "Vitafoam", "Royal Home", "Lifemate", "Nexus Furniture"],
    price: [25_000, 1_400_000],
    packClass: "bulky",
    axes: ["colour"],
  },
  "power-energy": {
    brands: ["Ox", "Elepaq", "Luminous", "Felicity", "Oraimo", "Sumec Firman", "Bruhm"],
    price: [4_000, 1_650_000],
    packClass: "large",
    axes: ["capacity", "colour"],
  },
  "phones-electronics": {
    brands: ["Samsung", "Tecno", "Infinix", "itel", "Apple", "Xiaomi", "Oraimo", "HP", "Hisense"],
    price: [3_500, 2_400_000],
    packClass: "small",
    axes: ["colour", "storage"],
  },
  "health-wellness": {
    brands: ["Emzor", "Forever Living", "GNC", "Swiss Herbal", "Nature's Field", "Omron"],
    price: [1_500, 220_000],
    packClass: "small",
    axes: ["size"],
  },
  "food-groceries": {
    brands: ["Mama Gold", "Golden Penny", "Dangote", "Devon King's", "Honeywell", "Indomie", "Peak"],
    price: [700, 145_000],
    packClass: "bulky",
    axes: ["weight"],
    unit: "kg",
  },
  agriculture: {
    brands: ["Premier Seeds", "Vital Feed", "Top Feeds", "Jubaili Agrotec", "Animal Care"],
    price: [900, 260_000],
    packClass: "bulky",
    axes: ["weight"],
    unit: "kg",
  },
  "baby-kids": {
    brands: ["Pampers", "Huggies", "Molfix", "Ruff n Tumble", "Fisher-Price", "Chicco", "Cussons Baby"],
    price: [1_500, 150_000],
    packClass: "medium",
    axes: ["size", "colour"],
  },
  automotive: {
    brands: ["Bosch", "Total", "Mobil", "Michelin", "Dunlop", "NGK", "Denso"],
    price: [3_000, 2_800_000],
    packClass: "large",
    axes: ["colour"],
  },
  "services-digital": {
    brands: ["Finstore Pro", "Studio Lagos", "Naija Creatives", "Skillup NG", "PrintHub"],
    price: [3_000, 750_000],
    packClass: "digital",
    axes: [],
  },
  "building-hardware": {
    brands: ["Dulux", "Berger", "Ingco", "Total Tools", "Cutix", "Bosch"],
    price: [1_500, 620_000],
    packClass: "bulky",
    axes: ["colour"],
  },
  "sports-fitness": {
    brands: ["Nike", "Adidas", "Puma", "Everlast", "Decathlon"],
    price: [2_500, 420_000],
    packClass: "medium",
    axes: ["size", "colour"],
  },
  "books-stationery": {
    brands: ["Learn Africa", "Oxford", "Bic", "Hero", "Kingsize"],
    price: [600, 85_000],
    packClass: "small",
    axes: [],
  },
  "art-crafts": {
    brands: ["Craft Naija", "Resin Republic", "Yarn House", "Handmade Lagos"],
    price: [1_200, 120_000],
    packClass: "small",
    axes: ["colour"],
  },
};

/**
 * Real-feeling [brand, model] pairs for the subcategories buyers land on first.
 * The brand travels with the model — a random pairing produces "Apple Galaxy
 * A05s", which reads as fake instantly.
 */
const MODELS: Record<string, [string, string][]> = {
  phones: [
    ["Samsung", "Galaxy A15 128GB"], ["Samsung", "Galaxy A05s 64GB"], ["Tecno", "Spark 20 Pro 256GB"],
    ["Tecno", "Camon 30 256GB"], ["Infinix", "Hot 40i 128GB"], ["Infinix", "Note 40 256GB"],
    ["Xiaomi", "Redmi 13C 128GB"], ["Apple", "iPhone 13 128GB"], ["Apple", "iPhone 12 64GB"],
    ["itel", "A60s 128GB"], ["Samsung", "Galaxy Tab A9 64GB"], ["Samsung", "Galaxy A25 5G 128GB"],
  ],
  "laptops-computing": [
    ["HP", "EliteBook 840 G8"], ["HP", "Pavilion 15 Ryzen 5"], ["Apple", "MacBook Air M1"],
    ["HP", "ProBook 450 G9"], ["Samsung", "Galaxy Book 3"], ["HP", "15s Core i5 512GB"],
  ],
  "tv-entertainment": [
    ["Hisense", '43" Smart UHD TV'], ["Hisense", '32" LED TV'], ["Samsung", '65" Smart TV'],
    ["Hisense", '50" Frameless Smart TV'], ["Hisense", '43" Google TV'],
  ],
  generators: [
    ["Elepaq", "2.5KVA Petrol Generator"], ["Elepaq", "3.5KVA Key Start Generator"],
    ["Sumec Firman", "1.8KVA Portable Generator"], ["Sumec Firman", "6.5KVA Diesel Generator"],
    ["Elepaq", "SP2500 Generator"],
  ],
  "rechargeable-fans": [
    ["Ox", '18" Rechargeable Standing Fan'], ["Bruhm", '16" Rechargeable Fan'],
    ["Ox", "Rechargeable Table Fan"], ["Bruhm", "Solar Rechargeable Fan"],
  ],
  "solar-panels-kits": [
    ["Felicity", "300W Solar Panel"], ["Luminous", "1.5KVA Solar Kit"],
    ["Felicity", "200W Monocrystalline Panel"], ["Luminous", "3KVA Hybrid Solar Kit"],
  ],
  "human-hair-wigs": [
    ["Virgin Luxe", 'Bone Straight 24" Wig'], ["Virgin Luxe", 'Curly Bob 12" Wig'],
    ["Brazilian Hair Co", 'Body Wave 18" Frontal Wig'], ["Virgin Luxe", "Pixie Cut Wig"],
    ["Brazilian Hair Co", 'Deep Wave 26" Wig'], ["Brazilian Hair Co", 'Kinky Straight 20" Wig'],
  ],
  "lace-ankara-aso-ebi": [
    ["Vlisco", "6 Yards Wax Print"], ["Hollandais", "5 Yards Hollandais Print"],
    ["ABC Wax", "6 Yards Super Wax"], ["Da Viva", "12 Yards Ankara Bundle"],
    ["Getzner", "5 Yards Swiss Voile Lace"],
  ],
  "perfume-cologne": [
    ["Lattafa", "Khamrah 100ml EDP"], ["Armaf", "Club de Nuit Intense 105ml"],
    ["Lattafa", "Asad 100ml EDP"], ["Armaf", "Ventana Blue 100ml"], ["Lattafa", "Yara 100ml"],
  ],
  "arabic-oud-fragrance": [
    ["Lattafa", "Oud Mood 100ml"], ["Lattafa", "Raghba 100ml"],
    ["Armaf", "Oud Al Layl 100ml"], ["Lattafa", "Ajwad 60ml"],
  ],
  "provisions-packaged-foods": [
    ["Mama Gold", "50kg Long Grain Rice"], ["Golden Penny", "25kg Parboiled Rice"],
    ["Mama Gold", "10kg Basmati Rice"], ["Golden Penny", "10kg Semovita"],
    ["Honeywell", "10kg Wheat Meal"], ["Dangote", "50kg Granulated Sugar"],
  ],
  "small-kitchen-appliances": [
    ["Binatone", "1.5L Blender"], ["Master Chef", "4L Air Fryer"],
    ["Binatone", "Electric Kettle 1.7L"], ["Scanfrost", "20L Microwave"],
    ["Master Chef", "Deep Fryer 3L"],
  ],
  "cookers-ovens-hobs": [
    ["Scanfrost", "4-Burner Gas Cooker"], ["Bruhm", "60x60 Gas Cooker with Oven"],
    ["Scanfrost", "Table Top Gas Cooker"], ["Bruhm", "5-Burner Gas Cooker"],
  ],
  "home-appliances": [
    ["Hisense", "212L Double Door Fridge"], ["Scanfrost", "95L Single Door Fridge"],
    ["Hisense", "350L Chest Freezer"], ["Bruhm", "7kg Washing Machine"],
  ],
  watches: [
    ["Casio", "MTP-1374 Analog Watch"], ["Curren", "8322 Chronograph Watch"],
    ["Fossil", "Grant Chronograph"], ["Casio", "G-Shock GA-2100"], ["Seiko", "5 Sports Automatic"],
  ],
  sneakers: [
    ["Nike", "Air Force 1 White"], ["Adidas", "Samba OG"], ["Nike", "Air Max 90"],
    ["Puma", "Suede Classic"], ["Adidas", "Ultraboost 22"],
  ],
  "power-banks-chargers": [
    ["Oraimo", "20000mAh Power Bank"], ["Oraimo", "10000mAh Slim Power Bank"],
    ["Oraimo", "30W Fast Charger"], ["Oraimo", "Solar Power Bank 20000mAh"],
  ],
  "audio-speakers": [
    ["Oraimo", "SoundGo Bluetooth Speaker"], ["Oraimo", "FreePods 4"],
    ["Hisense", "2.1Ch Sound Bar"], ["Oraimo", "BoomPop 2 Headphones"],
  ],
};

const DESCRIPTORS = [
  "Original", "Premium", "Classic", "Deluxe", "Pro", "Everyday", "Heavy Duty", "Compact",
];

const REVIEW_BODIES = [
  "Item came sealed and delivery was next day. Exactly as described.",
  "Quality is good for the price. Packaging could be better but no complaints.",
  "Bought two, both working fine. Merchant answered my questions before I paid.",
  "Delivery took an extra day but the rider called ahead. Product is genuine.",
  "Exactly what I ordered. Will buy from this store again.",
  "Works well so far. Been using it for three weeks with no issues.",
  "Colour is slightly different from the photo but I still like it.",
  "Fast delivery to Ikeja. Confirmed receipt the same day.",
  "Good value. I compared prices in Computer Village and this was cheaper.",
  "Solid build. My only issue is it came without the manual.",
];

const REVIEWERS = [
  "Adaeze O.", "Ibrahim K.", "Chinedu A.", "Funmi B.", "Musa D.", "Ngozi E.",
  "Tunde F.", "Blessing U.", "Yusuf S.", "Amaka N.", "Segun T.", "Halima A.",
];

function profileFor(leafSlug: string): Profile {
  const path = categoryPath(leafSlug);
  return PROFILES[path[0]?.slug ?? "fashion"] ?? PROFILES.fashion;
}

function axisValues(axis: string, leafSlug: string): string[] {
  switch (axis) {
    case "colour":
      return COLOURS;
    case "size":
      return leafSlug.includes("shoe") || leafSlug.includes("trainer") || leafSlug.includes("slipper")
        ? SHOE_SIZES
        : CLOTHING_SIZES;
    case "storage":
      return STORAGE;
    case "capacity":
      return CAPACITY;
    case "weight":
      return GROCERY_WEIGHTS;
    default:
      return [];
  }
}

const NOW = Date.now();
const DAY = 86_400_000;

/**
 * Subcategories with real photography. An image from the wrong vertical is
 * worse than a placeholder, so only matching pools are wired; everything else
 * keeps the generated art until merchant uploads arrive.
 */
/**
 * Every leaf category resolves to a pool of real photographs. There is no
 * fallback tier any more: a category that renders generated placeholder art
 * reads as an empty shelf, so the mapping below covers all 108 visible
 * subcategories (and the hidden ones, for when they are switched on).
 *
 * Where no pool is specific enough, the nearest honest neighbour is used —
 * a wardrobe photo for storage furniture is right; a random gradient is not.
 */
const PHOTO_POOL_BY_SUBCATEGORY: Record<string, string> = {
  // fashion & apparel
  "womens-tops": "fashion",
  "dresses-gowns": "fashion",
  "womens-bottoms": "active",
  "two-piece-sets": "fashion",
  "mens-clothing": "menswear",
  "unisex-clothing": "active",
  "outerwear-blazers": "menswear",
  "traditional-native-wear": "native",
  "underwear-sleepwear": "lingerie",
  "thrift-preloved": "menswear",
  "eyewear-sunglasses": "eyewear",
  "fashion-accessories": "jewelry",

  // footwear
  "womens-shoes": "heels",
  "mens-shoes": "sneakers",
  sneakers: "sneakers",
  "slippers-sandals": "slippers",
  "kids-shoes": "kidshoes",
  "unisex-footwear": "unisexshoes",

  // bags & luggage
  "handbags-totes": "bags",
  "backpacks-school-bags": "backpacks",
  "travel-luggage": "bags",
  "wallets-purses": "wallets",
  "mens-bags": "mensbags",

  // fabric & textiles
  "mens-fabric": "fabric",
  "lace-ankara-aso-ebi": "fabric",
  "net-chiffon-lining": "fabric",
  "sewing-supplies": "fabric",

  // hair & wigs
  "human-hair-wigs": "hair",
  "braided-synthetic-wigs": "hair",
  "hair-bundles-closures": "hair",
  "hair-care-treatments": "hair",
  "hair-tools-styling": "hair",
  "hair-accessories": "hair",

  // beauty & personal care
  "perfume-cologne": "perfume",
  "arabic-oud-fragrance": "perfume",
  "body-mist-spray": "perfume",
  "perfume-oils-rollons": "perfume",
  "skincare-face": "skincare",
  "body-care-lotions": "beauty",
  makeup: "beauty",
  "lip-care": "lips",
  "nail-care": "nails",
  "oral-personal-hygiene": "oral",
  "mens-grooming": "grooming",
  "cosmetic-packaging-materials": "skincare",
  "beauty-tools": "nails",

  // jewelry & watches
  "necklaces-pendants": "jewelry",
  earrings: "jewelry",
  "bracelets-anklets": "jewelry",
  rings: "jewelry",
  watches: "watches",
  "jewelry-sets": "jewelry",
  "jewelry-storage": "storage",

  // home & kitchen
  "cookware-pots": "kitchen",
  "kitchen-utensils": "kitchen",
  "small-kitchen-appliances": "appliances",
  "cookers-ovens-hobs": "appliances",
  "food-storage-flasks": "foodstorage",
  "home-appliances": "appliances",
  "cleaning-laundry": "cleaning",
  "pest-control": "cleaning",
  "air-care-home-fragrance": "perfume",
  "bathroom-accessories": "bathroom",
  "bedding-towels-linen": "bedding",
  "home-decor": "homeware",
  "storage-organisation": "storage",

  // furniture
  "beds-mattresses": "beds",
  "wardrobes-storage-furniture": "wardrobe",
  "sofas-living-room": "furniture",
  "tables-chairs": "furniture",
  "office-furniture": "office",

  // power & energy
  "rechargeable-fans": "appliances",
  "power-banks-chargers": "phoneacc",
  "solar-panels-kits": "solar",
  "inverters-batteries": "power",
  generators: "power",
  "rechargeable-lights": "lighting",
  "gas-cylinders-burners": "gascylinder",

  // phones & electronics
  phones: "phones",
  "phone-accessories": "phoneacc",
  "laptops-computing": "laptops",
  "audio-speakers": "audio",
  "tv-entertainment": "tv",
  "cameras-content-creation": "camera",
  "smartwatches-wearables": "smartwatch",

  // health & wellness
  "supplements-vitamins": "supplements",
  "sexual-wellness": "medical",
  "medical-supplies": "medical",
  "fitness-weight-management": "fitness",
  "herbal-remedies": "herbal",
  "smoking-vaping": "herbal",

  // food & groceries
  "provisions-packaged-foods": "provisions",
  "snacks-confectionery": "snacks",
  beverages: "beverages",
  "fresh-produce": "produce",
  "meat-fish-poultry": "meat",
  "bakery-prepared-food": "snacks",
  "spices-oils-condiments": "spices",

  // agriculture & farming
  "seedlings-seeds": "agric",
  "livestock-poultry": "agric",
  "animal-feed": "agric",
  "fertiliser-agrochemicals": "agric",
  "farm-tools-equipment": "agric",

  // baby & kids
  "baby-food-formula": "baby",
  "kids-clothing": "kidswear",
  "toys-ride-ons": "kids",
  "baby-care-hygiene": "baby",
  "kids-school-supplies": "school",

  // automotive
  "engine-transmission-parts": "autoparts",
  vehicles: "vehicles",
  "truck-heavy-duty-parts": "autoparts",
  "car-accessories-care": "auto",
  "tyres-batteries-fluids": "tyres",

  // services & digital
  "web-software-services": "services",
  "design-printing": "services",
  "photography-videography": "camera",
  "ebooks-downloads": "services",
  "courses-training": "services",
  "events-bookings": "services",

  // hidden departments — mapped so switching one on never ships placeholders
  "doors-windows": "wardrobe",
  "tiles-flooring": "bathroom",
  "plumbing-fittings": "autoparts",
  "paint-finishes": "cleaning",
  "tools-hardware": "autoparts",
  sportswear: "active",
  "team-jerseys": "active",
  "gym-equipment": "fitness",
  "sports-accessories": "active",
  books: "school",
  "office-supplies": "school",
  "school-stationery": "school",
  "resin-mould-supplies": "fabric",
  "crochet-yarn": "fabric",
  "handmade-decor": "homeware",
  "gifts-souvenirs": "homeware",
};

/** Three views per product, walked deterministically through the pool. */
/** Largest stride below the pool size that still visits every entry. */
function coprimeStride(n: number): number {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  for (let s = Math.max(1, Math.floor(n * 0.618)); s >= 1; s--) {
    if (gcd(s, n) === 1) return s;
  }
  return 1;
}

function photosFor(leafSlug: string, index: number, title: string) {
  const poolName = PHOTO_POOL_BY_SUBCATEGORY[leafSlug];
  const pool = poolName ? PHOTO_POOLS[poolName] : undefined;
  if (!pool?.length) return undefined;
  // A gallery never repeats a photo: a small pool yields a two-image gallery
  // rather than the same shot three times with "view 2" under it.
  const count = Math.min(3, pool.length);
  // Stride by a number coprime to the pool size, so consecutive products walk
  // the whole pool before any lead photo comes round again. Striding by the
  // gallery length instead (the obvious choice) shares a factor with most pool
  // sizes and collapsed a nine-photo pool to three distinct cards in a grid.
  const start = (index * coprimeStride(pool.length)) % pool.length;
  return Array.from({ length: count }, (_, i) => ({
    seed: pool[(start + i) % pool.length],
    alt: `${title}${i === 0 ? "" : ` — view ${i + 1}`}`,
    kind: "image" as const,
  }));
}

function buildProduct(leafSlug: string, index: number): Product {
  const leaf = findCategory(leafSlug)!;
  const path = categoryPath(leafSlug);
  const profile = profileFor(leafSlug);
  const r = rng(`${leafSlug}:${index}`);

  const known = MODELS[leafSlug]?.[index % MODELS[leafSlug].length];
  const brand = known ? known[0] : pick(r, profile.brands);
  const model = known ? known[1] : `${pick(r, DESCRIPTORS)} ${leaf.label.replace(/s$/, "")}`;
  const title = `${brand} ${model}`;

  const basePrice = Math.round(between(r, profile.price[0], profile.price[1]) / 50) * 50;
  const price = naira(basePrice);

  // A struck price only exists when a genuine prior price ran for >= 14 days.
  const hasDiscount = r() < 0.34;
  const discountRate = between(r, 0.08, 0.42);
  const originalPrice = hasDiscount ? naira(Math.round((basePrice / (1 - discountRate)) / 50) * 50) : undefined;

  // Merchants only get products from categories they actually stock.
  const l1 = path[0]?.slug ?? "";
  const eligible = MERCHANTS.filter((m) => m.sells.includes(l1));
  const pool = eligible.length ? eligible : MERCHANTS;
  const merchant = pool[Math.floor(r() * pool.length)];

  const axes = profile.axes.slice(0, 2);
  const variants: Variant[] = [];
  const axisSets = axes.map((axis) => ({
    axis,
    values: pickSome(r, axisValues(axis, leafSlug), Math.min(4, Math.max(2, Math.floor(between(r, 2, 5))))),
  }));

  if (axisSets.length === 0) {
    variants.push({
      id: `v_${leafSlug}_${index}_0`,
      sku: `${slugify(brand)}-${index}-std`.toUpperCase(),
      attributes: {},
      price,
      stock: Math.floor(between(r, 0, 40)),
    });
  } else {
    const [a, b] = axisSets;
    const combos = b
      ? a.values.flatMap((av) => b.values.map((bv) => ({ [a.axis]: av, [b.axis]: bv })))
      : a.values.map((av) => ({ [a.axis]: av }));
    combos.forEach((attributes, i) => {
      // Later axis steps cost more — storage, size and weight all scale price.
      const step = Object.values(attributes).join("|");
      const bump = 1 + (hash(step) % 40) / 100;
      variants.push({
        id: `v_${leafSlug}_${index}_${i}`,
        sku: `${slugify(brand)}-${index}-${i}`.toUpperCase(),
        attributes,
        price: money(Math.round((price.amount * bump) / 5000) * 5000, "NGN"),
        stock: r() < 0.15 ? 0 : Math.floor(between(r, 1, 35)),
      });
    });
  }

  const inStock = variants.filter((v) => v.stock > 0);
  // Default preselection is the cheapest in-stock variant.
  const defaultVariant = inStock.sort((x, y) => x.price.amount - y.price.amount)[0];
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  const reviewCount = r() < 0.18 ? 0 : Math.floor(between(r, 3, 900));
  const average = reviewCount === 0 ? undefined : Math.round(between(r, 3.4, 4.9) * 10) / 10;
  const histogram = buildHistogram(reviewCount, average ?? 0);

  const dealRoll = r();
  let deal: Deal | undefined;
  if (originalPrice && dealRoll < 0.3) {
    deal = { kind: "limited", label: "Limited-time deal", endsAt: new Date(NOW + between(r, 1, 60) * 3_600_000).toISOString() };
  } else if (originalPrice && dealRoll < 0.36) {
    deal = { kind: "grant", label: "SMEDAN price" };
  } else if (originalPrice) {
    deal = { kind: "standing" };
  }

  const condition: Product["condition"] =
    leafSlug.includes("refurbished") ? "refurbished" : r() < 0.12 ? "used" : "new";

  const imageCount = Math.floor(between(r, 3, 8));
  const images =
    photosFor(leafSlug, index, title) ??
    Array.from({ length: imageCount }, (_, i) => ({
      seed: `${leafSlug}-${index}-${i}`,
      alt: `${title}${i === 0 ? "" : ` — view ${i + 1}`}`,
      kind: "image" as const,
    }));

  const unitPrice = profile.unit
    ? { value: naira(Math.round(basePrice / Math.max(1, Math.floor(between(r, 1, 25))))), unit: profile.unit }
    : undefined;

  const digital = isDigital(leafSlug);

  return {
    id: `p_${hash(`${leafSlug}:${index}`).toString(36)}`,
    slug: slugify(title),
    title,
    brand,
    categorySlug: leafSlug,
    categoryPath: path,
    images,
    price: defaultVariant?.price ?? price,
    originalPrice,
    originalPriceVerified: Boolean(originalPrice),
    unitPrice,
    variants,
    defaultVariantId: defaultVariant?.id,
    description: buildDescription(title, brand, leaf.label, merchant.originCity),
    keyDetails: buildKeyDetails(r, leaf.label, brand),
    specs: buildSpecs(r, brand, leaf.label, condition, profile),
    merchant,
    rating: reviewCount ? { average: average!, count: reviewCount, histogram } : undefined,
    packClass: digital ? "digital" : profile.packClass,
    maxPerOrder: digital ? 1 : Math.floor(between(r, 5, 20)),
    condition,
    deal,
    listedAt: new Date(NOW - Math.floor(between(r, 0, 220)) * DAY).toISOString(),
    unitsSold7d: Math.floor(between(r, 0, 180)),
    totalStock,
  };
}

function buildHistogram(count: number, average: number): number[] {
  if (!count) return [0, 0, 0, 0, 0];
  const weights = [1, 2, 4, 10, 24].map((w, i) => w * Math.max(0.1, 1 - Math.abs(i + 1 - average) / 2));
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => Math.round((w / total) * count));
  const drift = count - raw.reduce((a, b) => a + b, 0);
  raw[4] += drift;
  return raw;
}

function buildDescription(title: string, brand: string, leafLabel: string, city: string): string {
  return [
    `<p><strong>${title}</strong> — sold and dispatched from ${city}. Every unit is checked before it leaves the store.</p>`,
    `<p>This is an original ${brand} product. What you see in the photos is exactly what is sent to you. Photos were taken in-store, not downloaded.</p>`,
    "<h3>What's in the box</h3>",
    "<ul><li>1 × main item</li><li>Manufacturer packaging</li><li>Where applicable, accessories and manual</li></ul>",
    "<p>If anything is wrong with your order, raise an issue from your order page within 7 days of delivery and we will resolve it before the store is paid.</p>",
  ].join("");
}

function buildKeyDetails(r: () => number, leafLabel: string, brand: string): string[] {
  const pool = [
    `Genuine ${brand} product`,
    "Checked before dispatch",
    "7-day return window",
    `Suitable for everyday use`,
    "Nationwide delivery available",
    `Backed by Finstore buyer protection`,
    `${leafLabel} — current stock`,
  ];
  return pickSome(r, pool, 4);
}

function buildSpecs(
  r: () => number,
  brand: string,
  leafLabel: string,
  condition: string,
  profile: Profile,
): Array<{ label: string; value: string }> {
  // Merchants who supplied nothing are real — the PDP hides the section entirely.
  if (r() < 0.12) return [];
  const specs = [
    { label: "Brand", value: brand },
    { label: "Category", value: leafLabel },
    { label: "Condition", value: condition === "new" ? "New" : condition === "used" ? "Used" : "Refurbished" },
    { label: "Warranty", value: pick(r, ["None", "1 month", "3 months", "6 months", "1 year"]) },
    { label: "Package weight", value: `${(between(r, 0.2, 18)).toFixed(1)} kg` },
    { label: "Shipping class", value: profile.packClass },
  ];
  if (profile.axes.includes("colour")) specs.push({ label: "Available colours", value: pickSome(r, COLOURS, 3).join(", ") });
  return specs;
}

/**
 * The live catalog is ~62,000 products. Generating that in-process would be
 * pointless, so each subcategory gets a proportional slice of a ~3,700-product
 * mock — the shape of the real catalog at a workable size. Displayed counts
 * always come from the actual result set, never from `productCount`.
 */
const CATALOG_SCALE = 0.06;

function buildCatalog(): Product[] {
  const out: Product[] = [];
  for (const sub of allSubcategories()) {
    // Hidden subcategories are not merchandised, so they get no stock at all.
    if (sub.hidden) continue;
    const count = Math.max(3, Math.round(sub.productCount * CATALOG_SCALE));
    for (let i = 0; i < count; i++) out.push(buildProduct(sub.slug, i));
  }
  return out;
}

export const CATALOG: Product[] = buildCatalog();

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));

export function productById(id: string): Product | undefined {
  return BY_ID.get(id);
}

/**
 * URLs are `{slug}-{shortId}`. The lookup is by the id suffix alone and must be
 * exact — a substring match can serve the wrong product for a mistyped URL,
 * which is worse than a 404. The slug is never trusted (merchants rename).
 */
export function productByRouteParam(param: string): Product | undefined {
  const shortId = param.slice(param.lastIndexOf("-") + 1);
  if (!shortId) return undefined;
  return BY_ID.get(`p_${shortId}`);
}

export function productHref(product: Product): string {
  return `/market/p/${product.slug}-${product.id.replace("p_", "")}`;
}

export function productsInCategory(slug: string): Product[] {
  const subs = new Set(subcategoriesUnder(slug));
  return CATALOG.filter((p) => subs.has(p.categorySlug));
}

export function productsByMerchant(merchantId: string): Product[] {
  return CATALOG.filter((p) => p.merchant.id === merchantId);
}

export function reviewsFor(product: Product): Review[] {
  if (!product.rating) return [];
  const r = rng(`reviews:${product.id}`);
  const count = Math.min(product.rating.count, 24);
  return Array.from({ length: count }, (_, i) => {
    const stars = weightedStar(r, product.rating!.histogram);
    return {
      id: `r_${product.id}_${i}`,
      author: pick(r, REVIEWERS),
      rating: stars,
      date: new Date(NOW - Math.floor(between(r, 1, 180)) * DAY).toISOString(),
      body: pick(r, REVIEW_BODIES),
      verified: true,
      photos: r() < 0.25 ? [`${product.id}-rev-${i}`] : [],
      helpful: Math.floor(between(r, 0, 40)),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function weightedStar(r: () => number, histogram: number[]): number {
  const total = histogram.reduce((a, b) => a + b, 0) || 1;
  let roll = r() * total;
  for (let i = 4; i >= 0; i--) {
    roll -= histogram[i];
    if (roll <= 0) return i + 1;
  }
  return 5;
}

/** Products with a live deal, ordered by soonest expiry. */
export function dealProducts(): Product[] {
  return CATALOG.filter((p) => p.deal && p.originalPrice).sort((a, b) => {
    const ax = a.deal?.endsAt ? Date.parse(a.deal.endsAt) : Number.MAX_SAFE_INTEGER;
    const bx = b.deal?.endsAt ? Date.parse(b.deal.endsAt) : Number.MAX_SAFE_INTEGER;
    return ax - bx;
  });
}

/** Rolling 7-day ranking by completed orders. Placed-order ranking is gameable. */
export function bestSellers(categorySlug?: string): Product[] {
  const pool = categorySlug ? productsInCategory(categorySlug) : CATALOG;
  return [...pool].sort((a, b) => b.unitsSold7d - a.unitsSold7d);
}

/** Completed orders in the window — the suppression threshold reads from this. */
export function completedOrdersInWindow(categorySlug?: string): number {
  const pool = categorySlug ? productsInCategory(categorySlug) : CATALOG;
  return pool.reduce((sum, p) => sum + p.unitsSold7d, 0);
}

export function newArrivals(categorySlug?: string): Product[] {
  const cutoff = NOW - 30 * DAY;
  const pool = categorySlug ? productsInCategory(categorySlug) : CATALOG;
  return pool
    .filter((p) => Date.parse(p.listedAt) >= cutoff)
    .sort((a, b) => b.listedAt.localeCompare(a.listedAt));
}

export function relatedProducts(product: Product, limit = 8): Product[] {
  return CATALOG.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, limit);
}

export function moreFromMerchant(product: Product, limit = 8): Product[] {
  return CATALOG.filter((p) => p.merchant.id === product.merchant.id && p.id !== product.id).slice(0, limit);
}

export function brandsIn(products: Product[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.brand) continue;
    counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function statesIn(products: Product[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.merchant.originState, (counts.get(p.merchant.originState) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function variantValuesIn(products: Product[], axis: string): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const v of p.variants) {
      const value = v.attributes[axis];
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count }));
}
