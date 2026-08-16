# Working in this codebase

Buyer-facing marketplace frontend. Read `README.md` first for architecture and
what is mocked. This file is the set of rules that are easy to break by accident.

## Non-negotiables

**Money.** Amounts are integers in minor units, never floats, never strings.
`formatMoney(money, config)` / `formatMoneyWith(money, format)` are the only
places a currency symbol may appear. Never write `₦` in a component. Never
convert between currencies for display — a buyer sees naira because the merchant
priced in naira.

**Country config.** No hardcoded state lists, phone regexes, region labels,
payment methods or address fields in components. All of it comes from
`CountryConfig` in `lib/country.ts`. The landmark field is Nigeria-specific and
is a config flag.

**Auth.** Email and password for both sign-in and account creation. The account
identity is the email — the delivery phone belongs to the address, because that
is who the rider calls. Never gate browsing, cart or add-to-cart behind auth;
only checkout and order history. Never persist a password client-side.

**Locale segment.** Every route carries `{language}-{COUNTRY}`. Never serve
content on a bare path — `proxy.ts` redirects (307). Build links with
`localePath(locale, path)`, never by string concatenation.

**Filters are URL state.** Add a facet by extending `FacetKey` in
`lib/taxonomy.ts` and the predicate map in `lib/plp.ts`. Do not hold filter state
in a component — it breaks sharing, the back button and server rendering.

**Delivery is per merchant group.** Never blend a delivery cost or a delivery
date across merchants. `quoteDelivery` takes one merchant's lines.

## UI rules that carry a reason

- Product cards have fixed height per row; the rating line's space is reserved
  even when there are no reviews. Ragged card bottoms make a grid look amateur.
- Never render a rating of 0 or "No reviews yet" on a card — omit the line.
- Never show a delivery estimate unless it is real. A fake promise is worse than
  no promise.
- Unavailable variants render disabled with a diagonal strike, never hidden.
- Zero-count facet options are disabled and greyed, never hidden — hiding them
  makes the UI feel unstable.
- Merchant ratings are withheld below 10 rated orders; show "New merchant".
- Only show a struck-through original price when it is genuinely verified
  (`originalPriceVerified`). Fake anchoring is a regulatory problem.
- The word **"escrow" never appears in buyer-facing copy.** Say what happens:
  "the store is paid only after you confirm delivery".
- Colour is never the only signal. Out of stock says "Out of stock".
- Minimum tap target 44×44px (`tap-target` utility). Focus ring is 2px orange
  at 2px offset — do not remove outlines.

## Category tree

The tree in `lib/taxonomy.ts` mirrors the backend and is read-only: two levels,
21 departments, 108 subcategories. Only a **subcategory** can hold a product.
Never add, rename or re-slug a node to suit the UI — it has to match the API.

- Buyer-facing surfaces list `DEPARTMENTS` / `visibleSubcategories()`, never
  `TAXONOMY`, so `hidden` nodes stay out of nav, tiles, search and the sitemap.
  Their routes must 404.
- `productCount` is the backend figure. Use it for ordering and weighting only —
  every count shown to a buyer comes from the actual result set.
- Departments flagged `digital` do not ship: their products get the `digital`
  pack class, are never delivery-quoted, and must not show an arrival date.

## Theme rules

- Dark is the default; light is a token swap via `next-themes` (`.light` class).
- **Chrome does not invert.** Header, category bar, footer, tab bar and any
  popover anchored in them use `--chrome-*` tokens (identical in both themes)
  and the `chrome-surface` utility. Putting `text-foreground` inside the chrome
  makes it black-on-black in light mode — use `text-chrome-foreground`.
  Never hardcode a hex or a Tailwind palette class (`bg-zinc-900`, `text-white`)
  for a foundational surface — use the semantic tokens.
- **Never `text-white` on `bg-primary` or `bg-success`.** White on Finstore
  orange is ~2.9:1 and fails AA. Use `text-primary-foreground` /
  `text-success-foreground`, which are near-black by design.
- Cards use the `surface-raised` utility, not a shadow class — on black a
  hairline border alone does not separate a card from the page.
- Anything visual must be checked in both themes. The fastest way is to flip
  `defaultTheme` in `app/[locale]/layout.tsx`, look, and flip it back.
- No SVG `id`s that are not unique per document. A grid renders the same
  component dozens of times, and duplicate gradient/clip ids silently make the
  first definition win for every later instance.

## Conventions

- Server components by default. Client components only where interaction demands
  it, and they take serializable view models (`CardModel`, `PdpModel`), never a
  `CountryConfig` (it contains a `RegExp`) and never a raw `Product`.
- Formatting happens at the render boundary — in `toCardModel` / `toPdpModel` —
  not in the component.
- Tokens live in `app/globals.css`: `:root` is dark, `.light` overrides, and
  `@theme inline` maps them to Tailwind. Use the semantic names
  (`text-muted-foreground`, `bg-primary`, `rounded-lg`), not raw hex.
- Reach for a shadcn primitive in `components/ui/` before writing a raw
  `button` / `input` / `select` / `dialog`. Add new ones with
  `npx shadcn@latest add <name>`.
- Radius: `rounded-lg` for cards, `rounded-md` for inputs and buttons,
  `rounded-full` for chips only.

## Hard-won rules

- **The proxy matcher must exclude every static-asset path.** A locale 307 on
  a font file makes all @font-face rules silently error and the whole site
  falls back to system fonts — that is how the naira sign once rendered as a
  strikethrough through prices. Anything added under `public/` needs a matcher
  exclusion.
- **Fonts are self-hosted and self-subset** (`public/fonts/*.woff2`, sources
  and the fontTools command in `assets/fonts/`). Never reintroduce
  `next/font/google`: Google's subset pipeline split U+20A6 behind a
  unicode-range browsers skipped. If the UI gains a new special character,
  add it to the subset command and regenerate.
- No emoji as interface iconography. Lucide icons or nothing.

- **Never add a segment-level `loading.tsx`.** It flushes a 200 shell before
  `notFound()` can run, turning every missing page into a soft 404. Suspense
  belongs inside pages, below the not-found decision.
- Client persistence goes through `lib/client-store.ts`
  (`useSyncExternalStore`), never `useEffect` + `localStorage.getItem`. The
  lint rule `react-hooks/set-state-in-effect` runs at error level and will
  catch you.
- Sticky elements position with `var(--header-h)` (published by the header's
  ResizeObserver), never a hardcoded top offset — the header's height varies.
- Dialogs, sheets and confirmations use the Radix primitives in
  `components/ui/` so focus trapping and scroll locking are never hand-rolled.
  Anything mounted-but-hidden with `pointer-events-none` also needs `inert`,
  or its contents stay in the tab order.
- Inverse surfaces (toast, offline banner, rank badge) pair `bg-foreground`
  with `text-background` — `text-white` on `bg-foreground` is invisible in
  dark mode.

## Before you commit

```bash
npx tsc --noEmit    # must be clean
npm run lint        # must be completely clean — zero errors, zero warnings
npm run build       # must compile every route
```
