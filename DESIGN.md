# Design — TripDee

A locked design system for this app. Every page redesign reads this file before
emitting code. v4: Hum-based playful — pear/cyan/coral on warm cream, soft
push buttons, borderless tinted surfaces, spring motion, full light + dark.
Replaces v3 (chunky ink borders + tangerine) per user approval 2026-09-13.
Brand name, tagline, CTA labels, and copy intent carry over unchanged.

## Genre

playful (Hum register — warm, alive, rounded; never childish)

## Macrostructure family

- Marketing pages (van/car discovery home): **Marquee Hero** — off-centre
  statement, search band below it, the page becomes a list below the fold.
  One photo band + max one sticker per page.
- App pages (corporate inquiry, driver register, vehicle detail, portals):
  **Split diptych** task layouts — pitch panel + form card, photo + facts.
- Content pages (hotel stays, sponsor stories): one split sponsor feature +
  one slim sponsor strip per page — never two identical sponsor layouts.

## Theme

OKLCH only. Same token names as v3 (components reskin without renames);
values below. Full block in `tokens.css`; Tailwind v4 reads them via
`@theme inline` in `src/app/globals.css`.

Light:

- `--color-paper`      oklch(97% 0.012 95)   (cream; card merges into paper)
- `--color-paper-2`    oklch(94% 0.016 95)
- `--color-card`       oklch(97% 0.012 95)   (= paper; elevation via shadow)
- `--color-ink`        oklch(20% 0.012 250)
- `--color-ink-2`      oklch(42% 0.013 250)
- `--color-rule`       oklch(86% 0.014 95)
- `--color-accent`     oklch(86% 0.180 95)   (pear primary; ink text)
- `--color-accent-deep` oklch(58% 0.140 95)  (push edge)
- `--color-accent-ink` oklch(20% 0.012 250)
- `--color-accent-soft` mix 16% accent/paper
- `--color-focus`      oklch(50% 0.160 255)
- `--color-sun`        oklch(83% 0.170 95)   (stickers/highlights; ink text)
- `--color-sky`        oklch(50% 0.140 240)  (car tab fill + info; white text)
- `--color-leaf`       oklch(50% 0.130 155)  (verified/success; white text)
- `--color-berry`      oklch(50% 0.190 12)   (hotel tab fill; white text)
- `--color-grape`      oklch(50% 0.150 300)  (corporate fill; white text)
- each candy has a `-soft` tint (12-20% mix with paper)

Dark (`[data-theme="dark"]`): warm cocoa paper oklch(17% 0.012 60),
cream ink oklch(93% 0.010 95), pear kept bright for edges, candy
brightened, softs deep. See `tokens.css`.

Accent budget: pear owns primary CTAs + van tab; sky/berry/grape own one
tab family each; coral `#E4572E`-in-OKLCH owns the star-burst + the single
deal/pop moment only. Soft tints flood; vivid hues stay on small shapes.

## Typography

- Display: Nunito 800, tight tracking (-0.025em). Thai: Noto Sans Thai 700.
- Body: Nunito 400-700 / Noto Sans Thai 400-700.
- Mono: system mono — data contexts only (max 2 slots; figures prefer
  tabular-nums body).
- Display tracking: tight (-0.025em).
- Type scale anchor: `--text-display` = clamp(2.75rem, 5vw + 1rem, 4.5rem).
- Headings roman, never italic. H1 ≤ 7 words / ≤ 50 chars.

## Shapes

Borderless tinted surfaces + layered shadows. NO 2px ink chunky borders
anywhere (v3 voice retired). Hairline 1px `rule` for input rest state;
2px dashed `rule` for friendly dividers. Pills for buttons/chips;
20px cards; 24px modals; 12px inputs. Sticker pills ringed, never tilted.

## Motion

- Easings: `--ease-out` fades; `--ease-spring` cubic-bezier(0.34,1.56,0.64,1)
  presses/hovers; `--ease-snap` tick-ups.
- Press: Hum push — lift 2px hover (edge grows), sink 3px active (edge 1px).
- Star-burst (coral, 420ms, once) on primary submits: search, register,
  quote request, board post. Opt-in via `data-burst`.
- Character moment (ONE per app): wordmark pear dot, gentle 4s pulse.
- Footer marquee 48s, pauses on hover. No scroll reveals; tab switch keeps
  the 220ms panel fade. Reduced-motion: opacity-only ≤150ms, no
  lift/marquee/burst/pulse.

## Microinteractions stance

- Silent success: board posts and filter results appear inline; no toasts.
- Filters apply instantly; result counts update live (honest DOM counts).
- Focus rings instant, 3px, `--color-focus` (≥3:1 vs surface).
- Hover states only under `@media (hover: hover)`; 44px touch floors.

## CTA voice (locked labels — one label per intent, carried from v3)

- Call driver: "โทรเลย" (number as caption, never the label).
- Chat driver: "ทัก LINE".
- Search: "ค้นหารถ N คัน" (live count), scrolls to results.
- Register: openers "ลงรถฟรี", submit "ยืนยันลงทะเบียนฟรี".
- Corporate: "ขอใบเสนอราคาฟรี". Reset filters: "ล้างตัวกรอง".
- Primary: pear push pill. Secondary: soft-tint push pill.
  Tertiary: hairline outline pill.

## Copy rules (carried from v3)

- Thai UI copy uses hyphens only — no em/en-dashes, no middle-dot chains.
  Ranges "1-9 คน", routes "ม่อนแจ่ม-แม่ริม".
- Section heads are headline + live count pill + caption, left-flush.
  Never small-caps eyebrows (max 2 ordinal-only per page), never the v3
  tilted icon blob.
- Voice: warm, encouraging Thai. Friendly, never cutesy-unclear.

## Per-page allowances

- Marketing pages MAY carry one photo band + one sticker + tab-mirror tint.
- App pages MUST keep decoration to the pitch panel — forms stay clean.
- Content pages: typography plus content photography only.

## What pages MUST share

- The wordmark (TripDee + pear pulse dot) and tagline "ทริปดีๆ เริ่มต้นที่นี่".
- The candy accents and placement (per-tab fills, verified leaf, price ink).
- The display + body fonts with the Thai fallback stack.
- The CTA voice and locked labels above.
- Section rhythm: headline, count pill, caption, generous air.

## What pages MAY differ on

- Section panel treatment (plain vs tint band vs ink panel).
- Sponsor treatment (one split feature + one slim strip maximum).
- Hero visual per tab (van/car share the photo band; hotel/corporate typographic).

## Exports

See `tokens.css` for the full drop-in `:root` block (light + dark).
Tailwind v4 reads the same tokens through `@theme inline` in `globals.css`.
