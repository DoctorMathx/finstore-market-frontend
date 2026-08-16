import { OG_SIZE, siteBanner } from "@/lib/og";

/**
 * The default share card for every route without a more specific one —
 * homepage, categories, deals, help. Product pages override it.
 */
export const alt = "Finstore Market — buy from verified Nigerian merchants";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return siteBanner();
}
