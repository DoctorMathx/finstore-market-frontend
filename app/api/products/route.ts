import { NextResponse, type NextRequest } from "next/server";
import { productById } from "@/lib/data/catalog";
import { toCardModel } from "@/lib/card";
import { getCountry } from "@/lib/country";

/**
 * Card models by id, for the client-only surfaces — saved items and recently
 * viewed — whose id lists live in localStorage and cannot be server-rendered.
 */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  const locale = request.nextUrl.searchParams.get("locale") ?? "en-NG";
  const config = getCountry(locale.split("-")[1] ?? "NG");

  const raw = request.cookies.get("fm_deliver_to")?.value;
  const destinationState = raw ? decodeURIComponent(raw).split("|")[0] : config.defaultRegion;

  const cards = ids
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => toCardModel(p, { config, destinationState }));

  return NextResponse.json({ cards });
}
