import Link from "next/link";
import type { ReactNode } from "react";
import { discountPercent, formatMoney, type Money } from "@/lib/money";
import type { CountryConfig } from "@/lib/country";
import { Badge as ShadBadge } from "@/components/ui/badge";
import { Skeleton as ShadSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ placeholders */

function seedHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Stand-in for the transcoded merchant upload. Deterministic from a seed so
 * server and client agree, and locked to 1:1 so grids never go ragged.
 *
 * The frame is painted with `--product-canvas` rather than a hardcoded white:
 * on the dark theme that is a muted off-white, which keeps product photography
 * legible without punching a bright rectangle out of a black page.
 */
export function ProductImage({
  seed,
  alt,
  label,
  className = "",
  priority = false,
}: {
  seed: string;
  alt: string;
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  // A seed that is a URL path is a real photo; anything else generates art.
  if (seed.startsWith("/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static assets; the optimizer is off
      <img
        src={seed}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // max-h/max-w keep a photo inside its frame even if a caller forgets to
        // constrain the box — the failure mode is a letterboxed image, never a
        // 900px-tall one that pushes the price off a phone screen.
        className={`max-h-full max-w-full bg-product-canvas object-cover ${className}`}
      />
    );
  }

  const h = seedHash(seed);
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  const initials = (label ?? alt)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <svg
      viewBox="0 0 400 400"
      // An empty alt means the caller already labels this image in text; a
      // role="img" with a blank name is an unnamed landmark to a screen reader.
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      className={className}
      // Hue is per-product; lightness and saturation come from the theme, so a
      // placeholder never punches a bright hole out of the dark page.
      style={
        {
          contentVisibility: priority ? "visible" : "auto",
          "--h": hue,
          "--h2": hue2,
        } as React.CSSProperties
      }
    >
      <defs>
        <linearGradient id={`g-${h}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--h) var(--ph-s) var(--ph-l-1))" />
          <stop offset="100%" stopColor="hsl(var(--h2) var(--ph-s) var(--ph-l-2))" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="var(--product-canvas)" />
      <rect x="16" y="16" width="368" height="368" rx="14" fill={`url(#g-${h})`} />
      <circle
        cx={140 + (h % 60)}
        cy={150 + (h % 40)}
        r={70 + (h % 30)}
        fill="hsl(var(--h) var(--ph-s) var(--ph-l-2))"
        opacity="0.55"
      />
      <rect
        x={180 + (h % 30)}
        y={190 + (h % 30)}
        width={120}
        height={120}
        rx="18"
        fill="hsl(var(--h2) var(--ph-s) var(--ph-l-1))"
        opacity="0.5"
      />
      <text
        x="200"
        y="215"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="76"
        fontWeight="600"
        fill="hsl(var(--h) var(--ph-s) var(--ph-text-l))"
        opacity="var(--ph-text-o)"
      >
        {initials}
      </text>
    </svg>
  );
}

export function MerchantLogo({ seed, name, size = 40 }: { seed: string; name: string; size?: number }) {
  const h = seedHash(seed);
  const hue = h % 360;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold ring-1 ring-border"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 40% 20%)`,
        color: `hsl(${hue} 70% 78%)`,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ rating */

const STAR_PATH = "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9z";

function StarRow({ size, className }: { size: number; className: string }) {
  return (
    <span className={`flex shrink-0 ${className}`} style={{ width: size * 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" className="shrink-0">
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Two stacked rows, the filled one clipped to the score. Deliberately avoids
 * per-star SVG gradient ids — those collide between cards on a grid, and the
 * first definition on the page silently wins for every later star.
 */
export function RatingStars({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size * 5, height: size }}
      aria-hidden="true"
    >
      <StarRow size={size} className="text-[var(--border-strong)]" />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <StarRow size={size} className="text-primary-strong" />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------- price */

export function PriceBlock({
  price,
  originalPrice,
  config,
  size = "md",
  className = "",
}: {
  price: Money;
  originalPrice?: Money;
  config: CountryConfig;
  size?: "md" | "lg";
  className?: string;
}) {
  const pct = discountPercent(price, originalPrice);
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={size === "lg" ? "text-price-lg text-foreground" : "text-price-md text-foreground"}>
        {formatMoney(price, config)}
      </span>
      {pct != null && originalPrice ? (
        <>
          <span className="text-small text-subtle-foreground line-through">{formatMoney(originalPrice, config)}</span>
          <span className="text-small font-semibold text-success">Save {pct}%</span>
        </>
      ) : null}
    </div>
  );
}

/** Price range shown until a variant resolves the choice to one number. */
export function PriceRange({
  min,
  max,
  config,
  size = "lg",
}: {
  min: Money;
  max: Money;
  config: CountryConfig;
  size?: "md" | "lg";
}) {
  return (
    <span className={size === "lg" ? "text-price-lg text-foreground" : "text-price-md text-foreground"}>
      {formatMoney(min, config)} – {formatMoney(max, config)}
    </span>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "solid";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-border bg-secondary text-muted-foreground",
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-destructive/30 bg-destructive-soft text-destructive",
    brand: "border-primary/30 bg-primary-soft text-primary-strong",
    solid: "border-transparent bg-primary text-primary-foreground",
  };
  return (
    <ShadBadge variant="outline" className={cn("rounded-full text-micro font-medium", tones[tone], className)}>
      {children}
    </ShadBadge>
  );
}

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span className="rounded-md bg-success px-1.5 py-0.5 text-micro font-semibold text-success-foreground">
      -{percent}%
    </span>
  );
}

/* ---------------------------------------------------------------- surfaces */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg surface-raised", className)}>{children}</div>;
}

export function SectionHeading({
  title,
  href,
  linkLabel = "See all",
  subtitle,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-h2">{title}</h2>
        {subtitle ? <p className="text-small text-muted-foreground">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="shrink-0 text-small font-medium text-primary-strong hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ states */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl surface-raised px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">🛍️</div>
      <h3 className="text-h2">{title}</h3>
      <p className="max-w-md text-body text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function InlineAlert({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "danger" | "success" | "info";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-destructive/30 bg-destructive-soft text-destructive",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-primary/30 bg-primary-soft text-primary-strong",
  };
  return (
    <Alert className={cn("rounded-md px-3 py-2", tones[tone])} role="status">
      <AlertDescription className="text-small [&>*]:text-current">{children}</AlertDescription>
    </Alert>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <ShadSkeleton className={cn("bg-secondary shimmer", className)} />;
}

/* ------------------------------------------------------------------ trust */

export function BuyerProtectionNote({ merchantName }: { merchantName?: string }) {
  return (
    <div className="rounded-md border border-primary/30 bg-primary-soft px-3 py-2.5">
      <p className="text-small font-semibold text-primary-strong">Buyer protection</p>
      <p className="mt-0.5 text-small text-muted-foreground">
        {merchantName ? `${merchantName} is` : "The store is"} paid only after you confirm the order arrived.
      </p>
    </div>
  );
}
