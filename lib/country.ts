/**
 * Country is the root config object. Currency, address shape, phone format,
 * payment methods, delivery network, legal entity and available languages all
 * hang off it. No component may hardcode any of these.
 */

export type CountryCode = "NG" | "GH" | "KE" | "ZA";
export type CurrencyCode = "NGN" | "GHS" | "KES" | "ZAR";
export type LocaleCode = string; // BCP 47, {language}-{COUNTRY}

export type AddressField = {
  name: string;
  label: string;
  type: "text" | "tel" | "select" | "textarea";
  required: boolean;
  /** select fields resolve their options from this key on the config */
  optionsKey?: "regions" | "subRegions";
  placeholder?: string;
  helper?: string;
};

export type PaymentMethod = {
  id: "card" | "transfer" | "ussd" | "wallet";
  label: string;
  description: string;
};

export type CountryConfig = {
  code: CountryCode;
  name: string;
  live: boolean;
  currency: {
    code: CurrencyCode;
    symbol: string;
    minorUnits: number;
    /** false => never render decimals unless the amount has non-zero minor units */
    showMinor: boolean;
  };
  languages: { code: LocaleCode; label: string; live: boolean }[];
  phone: { dialCode: string; pattern: RegExp; example: string };
  addressSchema: AddressField[];
  regionLabel: string;
  subRegionLabel: string;
  /** Nigeria-specific landmark field is a config flag, never a hardcoded input */
  hasLandmarkField: boolean;
  regions: string[];
  subRegionsByRegion: Record<string, string[]>;
  paymentMethods: PaymentMethod[];
  deliveryPartners: string[];
  legalEntity: string;
  defaultRegion: string;
  defaultSubRegion: string;
};

const NG_REGIONS = [
  "Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const NG_LGAS: Record<string, string[]> = {
  Lagos: [
    "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
    "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu",
    "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo",
    "Shomolu", "Surulere",
  ],
  Oyo: ["Ibadan North", "Ibadan South-West", "Egbeda", "Akinyele", "Oluyole", "Ogbomosho North"],
  "Abuja (FCT)": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"],
  Rivers: ["Port Harcourt", "Obio/Akpor", "Eleme", "Ikwerre", "Oyigbo"],
  Kano: ["Dala", "Fagge", "Gwale", "Kano Municipal", "Nassarawa", "Tarauni"],
  Enugu: ["Enugu East", "Enugu North", "Enugu South", "Nsukka", "Udi"],
  Ogun: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ijebu Ode", "Sagamu"],
  Kaduna: ["Chikun", "Kaduna North", "Kaduna South", "Zaria", "Igabi"],
  Anambra: ["Awka North", "Awka South", "Idemili North", "Nnewi North", "Onitsha North"],
  Delta: ["Warri South", "Uvwie", "Oshimili South", "Ughelli North"],
  Edo: ["Oredo", "Egor", "Ikpoba-Okha", "Ovia North-East"],
};

/** Any state without an explicit list falls back to a single central LGA entry. */
export function subRegionsFor(config: CountryConfig, region: string): string[] {
  return config.subRegionsByRegion[region] ?? [`${region} Central`, `${region} North`, `${region} South`];
}

export const NIGERIA: CountryConfig = {
  code: "NG",
  name: "Nigeria",
  live: true,
  currency: { code: "NGN", symbol: "₦", minorUnits: 2, showMinor: false },
  languages: [
    { code: "en-NG", label: "English", live: true },
    { code: "pcm-NG", label: "Nigerian Pidgin", live: false },
    { code: "ha-NG", label: "Hausa", live: false },
    { code: "yo-NG", label: "Yoruba", live: false },
    { code: "ig-NG", label: "Igbo", live: false },
  ],
  phone: {
    dialCode: "+234",
    pattern: /^0(70|71|78|80|81|89|90|91)\d{8}$/,
    example: "0801 234 5678",
  },
  regionLabel: "State",
  subRegionLabel: "LGA",
  hasLandmarkField: true,
  regions: NG_REGIONS,
  subRegionsByRegion: NG_LGAS,
  defaultRegion: "Lagos",
  defaultSubRegion: "Ikeja",
  addressSchema: [
    { name: "fullName", label: "Full name", type: "text", required: true },
    {
      name: "phone",
      label: "Phone number",
      type: "tel",
      required: true,
      placeholder: "0801 234 5678",
      helper: "The rider calls this number on delivery day.",
    },
    { name: "region", label: "State", type: "select", required: true, optionsKey: "regions" },
    { name: "subRegion", label: "LGA", type: "select", required: true, optionsKey: "subRegions" },
    { name: "street", label: "Street address", type: "text", required: true },
    {
      name: "landmark",
      label: "Nearest landmark",
      type: "text",
      required: true,
      placeholder: "Opposite Zenith Bank, Allen Avenue",
      helper: "Most addresses here are imprecise. A landmark gets your order delivered first time.",
    },
    { name: "notes", label: "Delivery notes (optional)", type: "textarea", required: false },
  ],
  paymentMethods: [
    { id: "card", label: "Debit card", description: "Verve, Mastercard, Visa" },
    { id: "transfer", label: "Bank transfer", description: "Pay to a one-time account number" },
    { id: "ussd", label: "USSD", description: "Dial a code on your phone to pay" },
    { id: "wallet", label: "Finstore wallet", description: "Pay from your wallet balance" },
  ],
  deliveryPartners: ["GIG Logistics", "Kwik Delivery", "Finstore Rider Network"],
  legalEntity: "Finstore Technologies Ltd (RC 1794226)",
};

export const GHANA: CountryConfig = {
  code: "GH",
  name: "Ghana",
  live: false,
  currency: { code: "GHS", symbol: "₵", minorUnits: 2, showMinor: true },
  languages: [
    { code: "en-GH", label: "English", live: false },
    { code: "tw-GH", label: "Twi", live: false },
  ],
  phone: { dialCode: "+233", pattern: /^0\d{9}$/, example: "024 123 4567" },
  regionLabel: "Region",
  subRegionLabel: "District",
  hasLandmarkField: false,
  regions: ["Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Northern"],
  subRegionsByRegion: { "Greater Accra": ["Accra Metropolitan", "Tema", "Ga East", "Ga West"] },
  defaultRegion: "Greater Accra",
  defaultSubRegion: "Accra Metropolitan",
  addressSchema: [
    { name: "fullName", label: "Full name", type: "text", required: true },
    { name: "phone", label: "Phone number", type: "tel", required: true, placeholder: "024 123 4567" },
    { name: "region", label: "Region", type: "select", required: true, optionsKey: "regions" },
    { name: "subRegion", label: "District", type: "select", required: true, optionsKey: "subRegions" },
    { name: "street", label: "Street address", type: "text", required: true },
    { name: "notes", label: "Delivery notes (optional)", type: "textarea", required: false },
  ],
  paymentMethods: [
    { id: "card", label: "Debit card", description: "Visa, Mastercard" },
    { id: "wallet", label: "Finstore wallet", description: "Pay from your wallet balance" },
  ],
  deliveryPartners: ["Finstore Rider Network"],
  legalEntity: "Finstore Ghana Ltd",
};

export const KENYA: CountryConfig = {
  ...GHANA,
  code: "KE",
  name: "Kenya",
  currency: { code: "KES", symbol: "KSh", minorUnits: 2, showMinor: false },
  languages: [
    { code: "en-KE", label: "English", live: false },
    { code: "sw-KE", label: "Swahili", live: false },
  ],
  phone: { dialCode: "+254", pattern: /^0\d{9}$/, example: "0712 345 678" },
  regionLabel: "County",
  subRegionLabel: "Sub-county",
  regions: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"],
  subRegionsByRegion: { Nairobi: ["Westlands", "Dagoretti", "Embakasi", "Kasarani"] },
  defaultRegion: "Nairobi",
  defaultSubRegion: "Westlands",
  legalEntity: "Finstore Kenya Ltd",
};

export const SOUTH_AFRICA: CountryConfig = {
  ...GHANA,
  code: "ZA",
  name: "South Africa",
  currency: { code: "ZAR", symbol: "R", minorUnits: 2, showMinor: true },
  languages: [
    { code: "en-ZA", label: "English", live: false },
    { code: "zu-ZA", label: "Zulu", live: false },
    { code: "af-ZA", label: "Afrikaans", live: false },
  ],
  phone: { dialCode: "+27", pattern: /^0\d{9}$/, example: "082 123 4567" },
  regionLabel: "Province",
  subRegionLabel: "Municipality",
  regions: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"],
  subRegionsByRegion: { Gauteng: ["Johannesburg", "Tshwane", "Ekurhuleni"] },
  defaultRegion: "Gauteng",
  defaultSubRegion: "Johannesburg",
  legalEntity: "Finstore South Africa (Pty) Ltd",
};

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  NG: NIGERIA,
  GH: GHANA,
  KE: KENYA,
  ZA: SOUTH_AFRICA,
};

export const LIVE_COUNTRIES = Object.values(COUNTRIES).filter((c) => c.live);

export function getCountry(code: string): CountryConfig {
  return COUNTRIES[code.toUpperCase() as CountryCode] ?? NIGERIA;
}
