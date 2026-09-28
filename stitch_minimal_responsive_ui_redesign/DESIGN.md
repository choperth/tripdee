---
name: Crafted Mobility System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#515f78'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0d1c32'
  on-primary-container: '#76849f'
  inverse-primary: '#b9c7e4'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00174b'
  on-tertiary-container: '#497cff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-canvas: '#f8fafc'
  surface-card: '#ffffff'
  surface-subtle: '#f1f5f9'
  border-hairline: '#e2e8f0'
  border-strong: '#cbd5e1'
  text-primary: '#0f172a'
  text-secondary: '#475569'
  text-muted: '#94a3b8'
  amber-soft: '#fef3c7'
  amber-deep: '#d97706'
  line-green: '#06c755'
  line-green-soft: '#e8f9ee'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.5rem
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system delivers an architectural, Swiss/Bauhaus-inspired experience for peer-to-peer and corporate travel mobility. It eliminates traditional OTA visual bloat—such as high-pressure scarcity badges, aggressive drop shadows, and visual noise—in favor of disciplined geometry, strict baseline alignment, and purposeful negative space.

### Core Tenets & Character
- **Bauhaus Utility & Clarity:** Form strictly follows function. Visual hierarchy is established via proportional type scales, pure hairline divisions, and deliberate spatial cadence rather than heavy decoration.
- **Architectural Minimalism:** Layouts utilize crisp grid-based enclosures, monolithic deep navy anchors, and subtle warm amber accents to signify high-intent actions.
- **Target Audience:** Group leisure travelers, corporate planners, private tour operators, and fleet logistics managers who value instant scannability, transparent fare calculations, and effortless operational confidence.

## Colors

The color palette centers on a deep architectural navy anchor paired with high-intent warm amber and crisp atmospheric neutrals.

### Strategic Color Roles
- **Primary Navy (`#0A192F`):** Anchors core navigational bars, primary typographic headers, high-intent action buttons, and dominant layout cards.
- **Secondary Warm Amber (`#F59E0B`):** Reserved strictly for high-conversion highlights, fleet availability statuses, dynamic fare badges, and rating metrics.
- **Tertiary Blue (`#2563EB`):** Dedicated to technical indicators, interactive waypoints, and non-blocking administrative workflows.
- **Neutral Slate (`#64748B`):** Drives secondary descriptive copy, tabular dividers, and structural outlines.
- **Domain Accent (`#06C755`):** Reserved exclusively for verified driver communication and direct messaging channels to maintain native user recognition.
- **Canvas & Surface Tiering:** Backgrounds rely strictly on `#F8FAFC` to isolate crisp `#FFFFFF` cards, bounded by 1px hairline edges (`#E2E8F0`).

## Typography

The typographic hierarchy uses Plus Jakarta Sans to combine clean geometric precision with humanist legibility.

### Implementation Principles
- **Display Weights:** Major headers feature negative letter-spacing (`-0.02em` to `-0.03em`) combined with an 800 weight, achieving an authoritative, poster-style architectural presence.
- **Reading Cadence:** Body copy maintains an open line-height ratio (1.5x–1.625x) to handle dense specifications, multi-lingual support, and technical breakdowns without cognitive strain.
- **Micro-Data:** Vehicle specifications (passenger count, luggage capacity, powertrain info) use `label-sm` with slight positive tracking (`0.02em`) for rapid scan-ability on smaller screens.

## Layout & Spacing

Layouts follow a modular column system grounded in a strict 4px/8px incremental rhythm.

### Grid Anatomy
- **Desktop (1200px max-width):** 12-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) margins. Content blocks adhere to clean asymmetric divisions (e.g., 8 columns for fleet vehicle listings, 4 columns for sticky quotation summary cards).
- **Tablet (768px – 1024px):** 8-column layout with 20px gutters and 24px margins; sidebar panels collapse into sliding bottom sheets or drawer overlays.
- **Mobile (< 768px):** 4-column layout with 16px (`1rem`) gutters and 16px margins, stacking horizontal filter rails into native touch carousels.

### Spacing Rules
- Use `space-sm` (8px) and `space-md` (16px) for interior component padding (inputs, chips, and button interiors).
- Use `space-lg` (24px) for card interior padding and structural cell boundaries.
- Separate distinct thematic sections with `space-2xl` (48px) to `space-3xl` (72px) to allow content breathing room.

## Elevation & Depth

Depth is established through crisp hairline boundaries, tonal shifts, and restrained ambient diffusion rather than blurred dropshadows.

### Layer Hierarchy
- **Level 0 (Base Canvas):** Flat `#F8FAFC` foundation.
- **Level 1 (Structural Modules & Cards):** `#FFFFFF` surface bounded by a crisp `1px solid #E2E8F0` border. Ambient resting shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Flyouts & Hover States):** Lifted panels, search drop-downs, and hovered cards: `0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` with `1px solid #CBD5E1`.
- **Level 3 (Modal Dialogs & Sticky Quotation Bars):** High-priority overlays: `0 20px 35px -10px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(15, 23, 42, 0.05)`.
- **Focus Rings:** Accessible keyboard focus states use a sharp, high-contrast double outline (`2px solid #0A192F` with a 2px offset).

## Shapes

The design system embraces a Bauhaus-inspired sharp geometric aesthetic. Radii are strictly constrained to 0px across containers, structural frames, and primary inputs, maintaining crisp geometric edges.

### Radius Constraints
- **Containers, Cards, & Panels:** 0px radius (completely square). All structural containment is governed by clean hairline borders and rectangular silhouettes.
- **Inputs, Buttons, & Dropdowns:** 0px radius. Form elements sit flush along standard grid lines.
- **Exceptions (Pills & Status Chips):** Status pills and verification indicators may selectively utilize a full pill radius (`9999px`) to create an immediate morphological contrast between dynamic status badges and rigid architectural containers.

## Components

### Buttons
- **Primary:** Background `#0A192F`, text `#FFFFFF`, 0px border radius, padding `0.75rem 1.5rem`. Hover shifts background to `#1E293B` with immediate 100ms transition.
- **Accent (High Intent):** Background `#F59E0B`, text `#0F172A`, font-weight 700, 0px border radius. Hover: `#D97706`.
- **Outline / Ghost:** Background transparent, `1px solid #CBD5E1`, text `#0F172A`. Hover: background `#F1F5F9`.
- **Direct Connect (Messaging):** Background `#06C755`, text `#FFFFFF`, 0px border radius, paired with verified communication icon.

### Form Inputs & Selectors
- **Structure:** Background `#FFFFFF`, `1px solid #CBD5E1`, 0px border radius, height `48px`, padding `0 1rem`.
- **State Changes:** On focus, border changes to `1px solid #0A192F` with a crisp `2px solid #0A192F` focus ring offset. Invalid states transition to `1px solid #BA1A1A`.
- **Labels & Hints:** Labels sit outside the inputs using `label-sm` in `#475569`. Error text renders in `caption` in `#BA1A1A`.

### Cards & Modular Grids
- **Fleet Showcase Cards:** Flat `#FFFFFF` fill with `1px solid #E2E8F0` border. Hero vehicle imagery is framed in a 16:10 aspect ratio with no internal radius. Metadata displays across a tight, hairline-divided 3-column specification strip (passengers, luggage, transmission).
- **Segmented Search Console:** Clean, rectilinear bar dividing fields via vertical `1px solid #E2E8F0` rules. Includes location pickers, calendar date selectors, and occupancy counts, capped with a flush terminal action trigger.

### Chips, Pills, & Badges
- **Status Tags:** Compact horizontal chips with 0px or full pill radius. Verified badges utilize `#FEF3C7` background with `#D97706` text.
- **Filter Chips:** Default state `#FFFFFF` with `1px solid #E2E8F0` border. Active state switches to `#0A192F` fill and `#FFFFFF` text.

### Checkboxes & Radio Buttons
- **Geometric Alignment:** Sharp square checkboxes (`18px x 18px`) and circular radios (`18px x 18px`).
- **Border & Fill:** Resting `1.5px solid #64748B`. Checked state fills `#0A192F` with an inverted white checkmark or inner dot.

### Lists & Quotation Tables
- **Dividers:** Clean `1px solid #E2E8F0` dividers between rows.
- **Row Styling:** Tabular numbers with right alignment for pricing figures; subtle hover highlight with `#F8FAFC`.