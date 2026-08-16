/** Browser cookie access, kept out of component bodies. */

const YEAR = 60 * 60 * 24 * 365;

export function writeCookie(name: string, value: string, maxAge = YEAR): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}
