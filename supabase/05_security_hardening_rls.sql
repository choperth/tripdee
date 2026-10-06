-- ==============================================================================
-- TripDee (ทริปดี) - 05 Security Hardening & RLS Policies Migration
-- รันไฟล์นี้ใน Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ปิดกั้นการเข้าถึงฐานข้อมูลด้วย Public Anon Key พร้อมสร้างตารางอัตโนมัติหากยังไม่มี
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENSURE ALL TABLES EXIST (CREATE TABLE IF NOT EXISTS)
-- ป้องกัน Error: 42P01 relation does not exist หากรันข้ามสเต็ป
-- ------------------------------------------------------------------------------

-- 1.1 Bookings
create table if not exists public.bookings (
    id text primary key default ('TD-BK-' || upper(substr(md5(random()::text), 1, 8))),
    vehicle_id text,
    driver_id text,
    customer_name text not null,
    customer_phone text not null,
    customer_line text,
    route text not null,
    travel_date text not null,
    total_days integer not null default 1 check (total_days >= 1),
    total_price numeric not null check (total_price >= 0),
    deposit_amount numeric not null check (deposit_amount >= 0),
    remaining_amount numeric not null check (remaining_amount >= 0),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired')),
    chillpay_transaction_id text,
    chillpay_payment_url text,
    chillpay_qr_payload text,
    is_contact_unlocked boolean not null default false,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

-- 1.2 Quotations
create table if not exists public.quotations (
    id text primary key default ('QT-' || to_char(now(), 'YYYY') || '-' || substr(md5(random()::text), 1, 6)),
    company_name text not null,
    contact_name text,
    phone text not null,
    travel_date text not null,
    route text not null,
    passengers text not null,
    estimated_price numeric not null,
    status text check (status in ('pending', 'confirmed', 'completed')) default 'pending',
    needs_tax_invoice boolean default true,
    car_count integer default 1 check (car_count between 1 and 20),
    vehicle_tier text default 'vip_van',
    org_type text default 'general',
    include_insurance boolean default true,
    assigned_partner text,
    lead_fee_status text default 'unpaid',
    lead_fee_amount numeric default 0,
    created_at timestamptz default now()
);

-- 1.3 Driver Leads
create table if not exists public.driver_leads (
    id text primary key default ('drv-lead-' || substr(md5(random()::text), 1, 8)),
    driver_name text not null,
    nickname text not null,
    phone text not null,
    line_id text,
    whatsapp text,
    wechat text,
    kakao text,
    vehicle_model text not null,
    seats text not null,
    plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow',
    plate_number text,
    can_issue_tax_invoice boolean default false,
    business_type text default 'individual',
    routes text not null,
    status text check (status in ('pending', 'verified', 'suspended')) default 'pending',
    created_at timestamptz default now()
);

-- 1.4 Vehicles
create table if not exists public.vehicles (
    id text primary key,
    title text not null,
    type text not null default 'van',
    seats integer not null default 9,
    driver_name text not null,
    driver_nickname text not null,
    driver_phone text not null,
    driver_line text,
    driver_whatsapp text,
    driver_wechat text,
    driver_kakao text,
    languages text[] default array['th']::text[],
    rating numeric default 5.0,
    review_count integer default 0,
    is_verified boolean default true,
    images text[] not null,
    zone_rates jsonb not null,
    rate_note text,
    location text not null,
    region text default 'north',
    popular_routes text[] not null,
    amenities text[] not null,
    description text,
    plate_type text default 'yellow',
    plate_number text,
    can_issue_tax_invoice boolean default false,
    business_type text default 'individual',
    is_available boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 1.5 Board Posts
create table if not exists public.board_posts (
    id text primary key default ('b-' || substr(md5(random()::text), 1, 8)),
    type text not null check (type in ('request', 'share', 'offer')),
    title text not null,
    zone_id text not null,
    date text not null,
    days integer default 1,
    seats integer default 1,
    price numeric default 0,
    price_note text,
    author_name text not null,
    author_phone text not null,
    author_line text not null,
    author_whatsapp text,
    author_wechat text,
    vehicle_label text,
    detail text default '',
    posted_at text default 'เมื่อสักครู่',
    is_verified boolean default false,
    category text default 'general',
    pin text,
    view_token text,
    is_closed boolean default false,
    is_negotiable boolean default false,
    max_quotes integer default 3,
    created_at timestamptz default now()
);

-- 1.6 Sponsors
create table if not exists public.sponsors (
    id text primary key,
    title text not null,
    category text not null,
    category_label text not null,
    tagline text,
    badge_text text,
    image text not null,
    link text not null,
    discount_text text,
    location text,
    created_at timestamptz default now()
);

-- 1.7 Analytics Events
create table if not exists public.analytics_events (
    id bigint generated always as identity primary key,
    event_name text not null,
    driver_id text,
    sponsor_id text,
    channel text,
    route_id text,
    timestamp timestamptz default now(),
    meta jsonb,
    created_at timestamptz default now()
);

-- 1.8 Push Subscriptions
create table if not exists public.push_subscriptions (
    id text primary key,
    endpoint text unique not null,
    p256dh text not null,
    auth text not null,
    role text default 'driver',
    created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
alter table public.bookings enable row level security;
alter table public.quotations enable row level security;
alter table public.driver_leads enable row level security;
alter table public.vehicles enable row level security;
alter table public.board_posts enable row level security;
alter table public.sponsors enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.analytics_events enable row level security;

-- ------------------------------------------------------------------------------
-- 3. DROP INSECURE & PERMISSIVE POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Allow public select on bookings" on public.bookings;
drop policy if exists "Allow public update on bookings" on public.bookings;
drop policy if exists "Allow public delete on bookings" on public.bookings;
drop policy if exists "Allow public select on quotations" on public.quotations;
drop policy if exists "Allow public update on quotations" on public.quotations;
drop policy if exists "Allow public delete on quotations" on public.quotations;
drop policy if exists "Allow public select on driver_leads" on public.driver_leads;
drop policy if exists "Allow public update on driver_leads" on public.driver_leads;
drop policy if exists "Allow public delete on driver_leads" on public.driver_leads;
drop policy if exists "Allow public insert on vehicles" on public.vehicles;
drop policy if exists "Allow public update on vehicles" on public.vehicles;
drop policy if exists "Allow public delete on vehicles" on public.vehicles;
drop policy if exists "Allow public update on board_posts" on public.board_posts;
drop policy if exists "Allow public delete on board_posts" on public.board_posts;
drop policy if exists "Allow public insert on sponsors" on public.sponsors;
drop policy if exists "Allow public update on sponsors" on public.sponsors;
drop policy if exists "Allow public delete on sponsors" on public.sponsors;
drop policy if exists "Allow public select on analytics_events" on public.analytics_events;

-- ------------------------------------------------------------------------------
-- 4. APPLY HARDENED SECURE POLICIES
-- ------------------------------------------------------------------------------

-- 4.1 Bookings: Public can create pending bookings; Reading, updating & unlocking strictly restricted to service_role
drop policy if exists "Allow public insert on bookings" on public.bookings;
create policy "Allow public insert on bookings"
    on public.bookings for insert
    with check (true);

drop policy if exists "Restrict read bookings to service_role" on public.bookings;
create policy "Restrict read bookings to service_role"
    on public.bookings for select
    using (auth.role() = 'service_role');

drop policy if exists "Restrict update bookings to service_role" on public.bookings;
create policy "Restrict update bookings to service_role"
    on public.bookings for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete bookings to service_role" on public.bookings;
create policy "Restrict delete bookings to service_role"
    on public.bookings for delete
    using (auth.role() = 'service_role');

-- 4.2 Quotations: Public can submit requests; Read/Update/Delete restricted to service_role
drop policy if exists "Allow public insert on quotations" on public.quotations;
create policy "Allow public insert on quotations"
    on public.quotations for insert
    with check (true);

drop policy if exists "Restrict read quotations to service_role" on public.quotations;
create policy "Restrict read quotations to service_role"
    on public.quotations for select
    using (auth.role() = 'service_role');

drop policy if exists "Restrict update quotations to service_role" on public.quotations;
create policy "Restrict update quotations to service_role"
    on public.quotations for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete quotations to service_role" on public.quotations;
create policy "Restrict delete quotations to service_role"
    on public.quotations for delete
    using (auth.role() = 'service_role');

-- 4.3 Driver Leads: Public can register; Read/Approve/Delete restricted to service_role
drop policy if exists "Allow public insert on driver_leads" on public.driver_leads;
create policy "Allow public insert on driver_leads"
    on public.driver_leads for insert
    with check (true);

drop policy if exists "Restrict read driver_leads to service_role" on public.driver_leads;
create policy "Restrict read driver_leads to service_role"
    on public.driver_leads for select
    using (auth.role() = 'service_role');

drop policy if exists "Restrict update driver_leads to service_role" on public.driver_leads;
create policy "Restrict update driver_leads to service_role"
    on public.driver_leads for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete driver_leads to service_role" on public.driver_leads;
create policy "Restrict delete driver_leads to service_role"
    on public.driver_leads for delete
    using (auth.role() = 'service_role');

-- 4.4 Vehicles: Public can read catalog; Mutations restricted to service_role
drop policy if exists "Allow public select on vehicles" on public.vehicles;
create policy "Allow public select on vehicles"
    on public.vehicles for select
    using (true);

drop policy if exists "Restrict insert vehicles to service_role" on public.vehicles;
create policy "Restrict insert vehicles to service_role"
    on public.vehicles for insert
    with check (auth.role() = 'service_role');

drop policy if exists "Restrict update vehicles to service_role" on public.vehicles;
create policy "Restrict update vehicles to service_role"
    on public.vehicles for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete vehicles to service_role" on public.vehicles;
create policy "Restrict delete vehicles to service_role"
    on public.vehicles for delete
    using (auth.role() = 'service_role');

-- 4.5 Board Posts: Public can browse and post; Mutations restricted to service_role
drop policy if exists "Allow public select on board_posts" on public.board_posts;
create policy "Allow public select on board_posts"
    on public.board_posts for select
    using (true);

drop policy if exists "Allow public insert on board_posts" on public.board_posts;
create policy "Allow public insert on board_posts"
    on public.board_posts for insert
    with check (true);

drop policy if exists "Restrict update board_posts to service_role" on public.board_posts;
create policy "Restrict update board_posts to service_role"
    on public.board_posts for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete board_posts to service_role" on public.board_posts;
create policy "Restrict delete board_posts to service_role"
    on public.board_posts for delete
    using (auth.role() = 'service_role');

-- 4.6 Sponsors: Public can view; Mutations restricted to service_role
drop policy if exists "Allow public select on sponsors" on public.sponsors;
create policy "Allow public select on sponsors"
    on public.sponsors for select
    using (true);

drop policy if exists "Restrict insert sponsors to service_role" on public.sponsors;
create policy "Restrict insert sponsors to service_role"
    on public.sponsors for insert
    with check (auth.role() = 'service_role');

drop policy if exists "Restrict update sponsors to service_role" on public.sponsors;
create policy "Restrict update sponsors to service_role"
    on public.sponsors for update
    using (auth.role() = 'service_role');

drop policy if exists "Restrict delete sponsors to service_role" on public.sponsors;
create policy "Restrict delete sponsors to service_role"
    on public.sponsors for delete
    using (auth.role() = 'service_role');

-- 4.7 Analytics Events: Public write only; Read restricted to service_role
drop policy if exists "Allow public insert on analytics_events" on public.analytics_events;
create policy "Allow public insert on analytics_events"
    on public.analytics_events for insert
    with check (true);

drop policy if exists "Restrict select analytics_events to service_role" on public.analytics_events;
create policy "Restrict select analytics_events to service_role"
    on public.analytics_events for select
    using (auth.role() = 'service_role');

-- 4.8 Push Subscriptions: Public register/unregister
drop policy if exists "Allow public insert on push_subscriptions" on public.push_subscriptions;
create policy "Allow public insert on push_subscriptions"
    on public.push_subscriptions for insert
    with check (true);

drop policy if exists "Allow public delete on push_subscriptions" on public.push_subscriptions;
create policy "Allow public delete on push_subscriptions"
    on public.push_subscriptions for delete
    using (true);
