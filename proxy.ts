import { NextResponse, type NextRequest } from "next/server";
import { isKnownLocale, resolveLocaleFromHints } from "@/lib/locale";

/**
 * Every route carries a locale segment, always. Bare paths resolve a country
 * and redirect — content is never served on the bare path, because a dual
 * canonical setup fragments organic traffic permanently.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && isKnownLocale(firstSegment)) return NextResponse.next();

  const cookieLocale = request.cookies.get("fm_locale")?.value;
  const locale =
    cookieLocale && isKnownLocale(cookieLocale)
      ? cookieLocale
      : resolveLocaleFromHints(request.headers.get("accept-language"));

  const target = new URL(`/${locale}${pathname === "/" ? "/market" : pathname}${search}`, request.url);
  // 307 — the resolve is per-visitor, so this must never be cached as permanent.
  return NextResponse.redirect(target, 307);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp|avif|ico)$).*)"],
};
