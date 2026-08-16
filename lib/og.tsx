import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Open Graph banners, rendered server-side per share. One visual system for
 * every surface: Finstore black, the sail mark, orange for the price.
 *
 * Fonts are local TTFs (satori cannot read woff2) chosen because they carry
 * U+20A6 — a share card whose price starts with a tofu box is worse than none.
 */

export const OG_SIZE = { width: 1200, height: 630 };

async function assets() {
  const [regular, semibold, logo] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Inter-SemiBold.ttf")),
    readFile(join(process.cwd(), "public/brand/finstore-logo.png")),
  ]);
  return {
    fonts: [
      { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
    ],
    logoSrc: `data:image/png;base64,${logo.toString("base64")}`,
  };
}

function Wordmark({ logoSrc, size = 56 }: { logoSrc: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori element, not DOM */}
      <img src={logoSrc} width={size} height={size * 1.45} alt="" />
      <div style={{ display: "flex", fontSize: 44, fontWeight: 600, color: "#ffffff", letterSpacing: -1 }}>
        Finstore&nbsp;<span style={{ color: "#f97316" }}>Market</span>
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "#000000",
        backgroundImage:
          "radial-gradient(900px 500px at 100% 0%, rgba(249,115,22,0.18), transparent 65%)",
        fontFamily: "Inter",
      }}
    >
      {children}
    </div>
  );
}

const TRUST_LINE = "Every order protected — the store is paid only after you confirm delivery.";

/** The default banner: any page that has no more specific card. */
export async function siteBanner(): Promise<ImageResponse> {
  const { fonts, logoSrc } = await assets();
  return new ImageResponse(
    (
      <Frame>
        <Wordmark logoSrc={logoSrc} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 600, color: "#ffffff", letterSpacing: -2, lineHeight: 1.05 }}>
            Buy from verified Nigerian merchants
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#a1a1aa", lineHeight: 1.35, maxWidth: 980 }}>
            {TRUST_LINE}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#71717a" }}>finstore.africa/market</div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}

export type ProductBannerInput = {
  title: string;
  priceLabel: string;
  originalPriceLabel?: string;
  merchantName: string;
  originState: string;
  digital: boolean;
};

/** A product's share card: title, price in orange, who is actually selling it. */
export async function productBanner(product: ProductBannerInput): Promise<ImageResponse> {
  const { fonts, logoSrc } = await assets();
  return new ImageResponse(
    (
      <Frame>
        <Wordmark logoSrc={logoSrc} size={44} />
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "block",
              fontSize: product.title.length > 46 ? 52 : 64,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: -1.5,
              lineHeight: 1.12,
              maxWidth: 1050,
              // Satori honours line clamping, so a long merchant title cannot
              // push the price off the canvas.
              lineClamp: 2,
            }}
          >
            {product.title}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 600, color: "#f97316", letterSpacing: -1 }}>
              {product.priceLabel}
            </div>
            {product.originalPriceLabel ? (
              <div style={{ display: "flex", fontSize: 36, color: "#71717a", textDecoration: "line-through" }}>
                {product.originalPriceLabel}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
            {product.digital
              ? `By ${product.merchantName} · Digital — sent by email`
              : `Sold by ${product.merchantName} · Ships from ${product.originState}`}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#71717a", maxWidth: 1050 }}>{TRUST_LINE}</div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}
