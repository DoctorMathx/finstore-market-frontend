import Link from "next/link";

/**
 * Root not-found boundary. The app's real root layout lives under `[locale]`,
 * so without a boundary here Next has nowhere to render a 404 that is outside a
 * locale — and unmatched routes answer 200 with 404 UI, which search engines
 * index as a soft 404.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 600, margin: 0 }}>We couldn&apos;t find that page</h1>
          <p style={{ color: "#a1a1aa", marginTop: "0.5rem" }}>
            The link may be old, or the product may have been delisted by its store.
          </p>
          <Link
            href="/en-NG/market"
            style={{
              display: "inline-block",
              marginTop: "1.25rem",
              padding: "0.7rem 1.25rem",
              borderRadius: 8,
              background: "#f97316",
              color: "#0a0a0a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Finstore Market
          </Link>
        </main>
      </body>
    </html>
  );
}
