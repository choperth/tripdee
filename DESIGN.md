# Design — TripDee

A locked design system for this app. Every page redesign reads this file before emitting code.
**v5: Clean Utility Marketplace** (Airbnb / Booking style) — crisp slate-50/white surfaces, authoritative sapphire blue actions (`#2563EB`), high-contrast typography, razor-sharp 1px borders, subtle layered shadows, and high-efficiency utility controls.
Replaces previous experimental states per user direction 2026-09-14.
Brand name, tagline, CTA labels, and copy intent carry over intact.

## Visual Thesis

A fast, high-contrast utility marketplace for Chiang Mai travelers and corporate organizers, organized around an authoritative search & filter console, clean modular vehicle comparison cards with crisp verified signals, and direct friction-free driver contact.

## Genre & Tone

- **Genre**: Clean Utility Marketplace (Global travel standard — crisp, authoritative, transparent).
- **Tone**: Professional, trustworthy, effortless, transparent, fast.

## Macrostructure Family

- **Marketing & Discovery Home**:
  - **Hero & Search Console**: Authoritative header with trust metric pills, integrated segment tab bar (VIP Vans, Self-drive Cars, Stays, Corporate Fleet), instant filter parameters (Zone, Seats, Dates, Search), and quick-tag chips.
  - **Results Grid**: Clean 1-to-3 column responsive comparison grid with active filter chips, live honest counts, and instant sorting/clearing.
- **App & Workflow Sections**:
  - **Corporate Section**: Enterprise procurement diptych — trust credentials + full tax invoice / withholding 3% assurance on the left; clean step-by-step quotation builder on the right.
  - **TripBoard**: Real-time matching board with clean route tags, passenger badges, and rapid request posting.
- **Detail Views & Modals**:
  - **Vehicle Detail Modal**: Comprehensive vehicle & driver specs, transparent pricing breakdown, verified paperwork badge, and direct call/LINE handoff.
  - **Registration & Portals**: Structured, low-friction forms with accessible validation and instant confirmation.

## Color System

- **Canvas & Surface**:
  - `--color-paper`: `#F8FAFC` (Slate-50 — clean, bright, modern)
  - `--color-paper-2`: `#F1F5F9` (Slate-100 — subtle section tint & tag background)
  - `--color-card`: `#FFFFFF` (Pristine elevated surface)
  - `--color-rule`: `#E2E8F0` (Slate-200 — crisp 1px borders)
  - `--color-rule-2`: `#CBD5E1` (Slate-300)
- **Ink & Typography**:
  - `--color-ink`: `#0F172A` (Slate-900 — high-contrast primary text)
  - `--color-ink-2`: `#475569` (Slate-600 — metadata and secondary text)
  - `--color-ink-deep`: `#020617` (Slate-950 — maximum emphasis)
- **Primary Action (Sapphire / Mobility Blue)**:
  - `--color-accent`: `#2563EB` (Blue 600 — trusted primary CTA)
  - `--color-accent-deep`: `#1D4ED8` (Blue 700 — hover & active state)
  - `--color-accent-ink`: `#FFFFFF` (White text)
  - `--color-accent-soft`: `#EFF6FF` (Blue 50 — active tab & badge fill)
  - `--color-focus`: `#2563EB`
- **Trust & Status Colors**:
  - `--color-leaf`: `#059669` (Emerald 600 — verified driver checks, success)
  - `--color-sun`: `#D97706` (Amber 600 — ratings, popular badges)
  - `--color-sky`: `#0284C7` (Sky 600 — self-drive tag)
  - `--color-berry`: `#E11D48` (Rose 600 — stay/hotel tag)
  - `--color-grape`: `#7C3AED` (Purple 600 — corporate fleet tag)

## Typography

- **Display & Headings**: Clean modern sans-serif (`Nunito` + `Noto Sans Thai` fallback), tight tracking (-0.02em), font-weight 700-800.
- **Body & Controls**: Font-weight 400-600, clear line-height (1.5), tabular numbers for prices and seats (`font-variant-numeric: tabular-nums`).
- **Data & IDs**: System mono for tax IDs and booking references.

## Shapes, Elevation & Borders

- **Radii**:
  - Cards: `14px` (`--radius-card`)
  - Modals: `20px` (`--radius-modal`)
  - Inputs & Buttons: `10px` (`--radius-input`)
  - Status Badges & Pills: `999px` (`--radius-pill`)
- **Borders**: Clean 1px solid `--color-rule` on cards and inputs for crisp boundary definition.
- **Shadows**:
  - Card default: `0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 12px -2px rgba(15, 23, 42, 0.05)`
  - Card hover/lift: `0 10px 25px -3px rgba(15, 23, 42, 0.09), 0 4px 10px -2px rgba(15, 23, 42, 0.04)`

## Motion & Transitions

- Micro-transitions: `140ms` - `200ms` `ease-out` for snappy, responsive feedback.
- Hover lift: subtle 2px translation with shadow enhancement; disabled when `prefers-reduced-motion: reduce`.
- No distracting ambient animations; motion serves state change and spatial causality only.

## CTA Voice & Labels

- Call driver: "โทรเลย"
- Chat driver: "ทัก LINE"
- Search: "ค้นหารถ N คัน"
- Corporate: "ขอใบเสนอราคาฟรี"
- Register: "ลงทะเบียนคนขับฟรี"
- Clear filters: "ล้างตัวกรอง"
