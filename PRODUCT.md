# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences, equal weight:

1. **Individual travelers** — Thai families and friend groups planning trips in Chiang Mai and nearby provinces. They browse VIP vans with drivers, self-drive rentals/SUVs, routes, and partner stays; they contact drivers directly by phone/LINE and care about trust (verified license/history), transparent pricing, and route expertise.
2. **Corporate / government organizers** — office admins and planners booking seminar trips, company outings, and multi-van convoys (2–10+ vans). They need quotations upfront and correct full tax invoices (with 3% withholding support) for reimbursement.

Secondary audiences: **drivers / vehicle owners** who list vehicles for free; **sponsor partners** (pool villas, hotels, auto services) who reach travelers through featured placements.

## Product Purpose

TripDee (ทริปดี) is a Chiang Mai–first marketplace that connects travelers directly with verified local drivers and quality stays. It exists to remove the broker layer — no hidden markup, no anonymous middlemen — while giving corporate customers the paperwork individual drivers normally cannot produce. Success means travelers book with confidence, drivers get direct bookings at fair prices, and organizers get compliant documents without chasing paperwork.

## Positioning

Contact the driver directly — no broker markup — with every driver license and history verified. A neighboring directory could list the same vans, but could not truthfully copy the combination of direct phone/LINE contact, published verified-driver checks, and corporate-grade tax invoicing from one Chiang Mai–focused marketplace.

## Operating Context

- Geography-first: Chiang Mai and Northern Thailand routes (ม่อนแจ่ม–แม่ริม, ดอยอินทนนท์, แม่กำปอง, ตัวเมือง/สนามบิน, cross-province to เชียงราย/ปาย/แม่ฮ่องสอน). Built to expand nationwide later; the data model must not hard-code one province.
- Contact happens off-platform: phone calls and LINE are the real booking channel; the site's job is discovery, trust, and handoff.
- Corporate workflow: quotation → booking → full tax invoice / receipt; convoys of matching vans with uniformed, non-smoking drivers.
- Trilingual UI: Thai, English, and Simplified Chinese via an in-app language switcher (driver/listing content stays in its posted language).
- Mobile browsing (travelers compare on phones) and desktop (organizers request quotes) both matter.

## Capabilities and Constraints

Confirmed:

- Next.js web app (existing codebase): browse/filter vehicles by type, zone, seats, keyword; popular-routes discovery; sponsor/partner placements; corporate quotation request form; free driver self-registration.
- Driver listings are free; revenue comes from sponsor and accommodation-partner placements, not from booking commissions or price markups.
- Brand name and tagline below are binding.

Explicitly undecided:

- Online payment or booking guarantees — currently contact-off-platform only.
- Review/rating verification mechanics (ratings exist in mock data; no confirmed policy).
- Nationwide expansion timing.

## Brand Commitments

- Name: **TripDee (ทริปดี)**, currently badged "เชียงใหม่".
- Tagline: "ทริปดีๆ เริ่มต้นที่นี่".
- Voice: warm, polite Thai, trust-forward (verified, safe, direct). No binding visual constraints recorded.

## Evidence on Hand

- Copy and IA in code: `src/app/page.tsx`, `src/components/` (Hero, Navbar, VehicleCard, CorporateSection, SponsorBanner, modals, Footer).
- Placeholder catalog data: `src/data/mockData.ts` (vehicles, sponsors, routes) — not real listings.
- Images are Unsplash placeholders; no real driver photos, vehicle photos, testimonials, case studies, or press. Future work must not fabricate reviews, ratings, customer logos, or booking counts.

## Product Principles

1. Direct beats intermediated: every flow shortens the path between traveler and driver, never inserts the platform as a toll.
2. Trust is shown, not claimed: verification, documents, and real contact details carry more weight than adjectives.
3. Chiang Mai depth first, breadth later: one region done well is worth more than thin national coverage.
4. Corporate paperwork is a feature, not an afterthought: quotes and tax invoices are first-class outputs.
5. Free-listing supply, sponsored demand-side revenue: monetization must never distort prices or rankings opaquely.
