import Image from "next/image";
import logo from "@/public/brand/finstore-logo.png";

/**
 * The Finstore mark, as served on finstore.africa. The asset is a red sail on
 * transparency, so it sits on both the dark and light themes unchanged.
 */
export function FinstoreLogo({
  size = 32,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Mark plus wordmark. `Market` is the sub-brand, set in the action colour. */
export function FinstoreWordmark({
  size = 32,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <FinstoreLogo size={size} priority={priority} />
      <span className="text-h2 leading-none tracking-tight text-chrome-foreground">
        Finstore <span className="text-primary">Market</span>
      </span>
    </span>
  );
}
