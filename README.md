# TripDee (ทริปดี) 🚐✨

ศูนย์รวมรถตู้พร้อมคนขับ รถเช่าขับเอง SUV และที่พักแนะนำในเชียงใหม่และทั่วไทย เชื่อมต่อผู้โดยสารและคนขับท้องถิ่นโดยตรง ไม่บวกค่านายหน้า ปลอดภัย ตรวจสอบเอกสารคนขับทุกคน พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษีเต็มรูปแบบ

---

## 🌟 Key Features

- **Fleet Directory**: ค้นหารถตู้ VIP (9–13 ที่นั่ง, ป้ายฟ้า/ป้ายเหลือง 30), รถเก๋ง SUV และรถเช่าขับเอง พร้อมตารางวันว่างจริง อัตราค่าบริการตามโซน และช่องทางติดต่อตรง (โทร, LINE, WhatsApp, WeChat)
- **TripBoard**: กระดานประกาศงานเดินทางแบบเรียลไทม์ ผู้โดยสารลงประกาศงาน คนขับเสนอราคาแข่งขันกันอย่างโปร่งใส พร้อมระบบล็อกคิวและแจ้งเตือน
- **B2B Corporate & Caravan**: ระบบคำนวณงบประมาณและขอใบเสนอราคาสำหรับองค์กร รองรับการจัดขบวนคาราวาน ประกันอุบัติเหตุกลุ่ม และใบกำกับภาษี
- **Driver Portal & Smart E-Card**: พอร์ทัลคนขับพาร์ตเนอร์สำหรับจัดการคิวงาน นามบัตรดิจิทัลพร้อม QR Code สแกนบันทึก vCard ลงสมุดโทรศัพท์ทันที
- **Admin Console**: แผงควบคุมระบบแอดมินความปลอดภัยสูง (แยกหน้าเข้าสู่ระบบ `/admin/login`, Session Cookie แบบ HttpOnly, ตรวจสอบข้อมูลคนขับ, จัดการใบเสนอราคา, สปอนเซอร์, และสถิติการใช้งาน)
- **Payment & Booking**: ระบบมัดจำล็อกคิวผ่าน ChillPay (PromptPay QR) พร้อมการตรวจ Checksum และ Webhook อัตโนมัติ
- **Push & LINE Notifications**: การแจ้งเตือน Web Push (VAPID) และ LINE Dispatcher ไปยังกลุ่มคนขับเมื่อมีงานใหม่
- **Internationalization (i18n)**: รองรับ 3 ภาษา (ไทย TH, English EN, 中文 ZH) พร้อมระบบ Fallback ลำดับชั้นสำหรับข้อมูลยานพาหนะและคู่ค้า
- **SEO & AEO Ready**: Structured Data (Schema.org / JSON-LD), OpenGraph, dynamic sitemap.xml, robots.txt รองรับ Search Engine และ AI Search Crawlers (GPTBot, ClaudeBot, PerplexityBot)

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (Strict Typechecking)
- **Styling**: Tailwind CSS & Lucide Icons & Material Symbols
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & idempotent migrations)
- **Authentication & Security**: HttpOnly Session Cookies, Server-Side Route Guard, Rate Limiting, Honeypot Anti-Spam
- **Payment**: ChillPay Payment Gateway (MD5 Checksum validation)
- **Notifications**: Web Push (VAPID), LINE Messaging API, Telegram Bot, Discord Webhooks

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm, pnpm, yarn, or bun

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-side operations)
- `ADMIN_SECRET_KEY` and `SESSION_SECRET` (Admin & Driver authentication)
- `NEXT_PUBLIC_SITE_URL` (Canonical site URL, default: `https://www.tripdeeth.com`)

### 3. Database Migrations
Database migrations are located in `supabase/`. Run SQL migrations in numerical order on your Supabase dashboard SQL editor:
- `supabase/01_initial_schema.sql` ... `supabase/11_phase1_schema_reconciliation.sql`

### 4. Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Best Practices

1. **Server-Side Route Protection**:
   - `/admin/*` routes require authenticated admin sessions verified via httpOnly cookies (`tripdee_admin_session`).
   - `/driver/*` routes verify driver identity through signed session tokens.
2. **Quotation & Data Privacy (PDPA)**:
   - Quotation records are tied to authenticated customer sessions (`customer_id`).
   - Phone numbers and license plates are masked on public surfaces.
   - Legacy and unowned records are restricted to admin access.
3. **Payment Security**:
   - Webhook payloads verify MD5 signatures against `CHILLPAY_MD5_SECRET`.
   - Exact deposit amounts and currency units are validated before unlocking contacts.
4. **Anti-Spam Honeypot**:
   - Public submission endpoints (`/api/leads/quote`, `/api/leads/driver`, `/api/board`, `/api/reviews`, `/api/payment/chillpay/create`) employ multi-layer honeypots (hidden trap fields + submission latency thresholds).

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Builds production-optimized bundle |
| `npm run start` | Runs built production server |
| `npm run lint` | Runs ESLint analysis across the repository |
| `npx tsc --noEmit` | Runs TypeScript compiler checks |

---

## 📄 License

Proprietary © TripDee. All rights reserved.
