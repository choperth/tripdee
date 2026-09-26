-- ==============================================================================
-- TripDee (ทริปดี) - Database Schema for Supabase
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABLE: quotations (คำขอใบเสนอราคา / งานเหมารถตู้ & นิติบุคคล)
-- ------------------------------------------------------------------------------
create table if not exists public.quotations (
    id text primary key default ('qt-' || substr(md5(random()::text), 1, 8)),
    company_name text not null,
    contact_name text,
    phone text not null,
    travel_date text,
    route text,
    passengers text,
    needs_tax_invoice boolean default true,
    estimated_price numeric default 0,
    status text default 'pending' check (status in ('pending', 'quoted', 'confirmed')),
    created_at timestamptz default now()
);

create index if not exists idx_quotations_status on public.quotations(status);
create index if not exists idx_quotations_created_at on public.quotations(created_at desc);

-- ------------------------------------------------------------------------------
-- 3. TABLE: driver_leads (ลงทะเบียนคนขับพาร์ตเนอร์ใหม่)
-- ------------------------------------------------------------------------------
create table if not exists public.driver_leads (
    id text primary key default ('drv-' || substr(md5(random()::text), 1, 8)),
    driver_name text not null,
    nickname text not null,
    phone text not null,
    line_id text,
    whatsapp text,
    wechat text,
    kakao text,
    vehicle_model text,
    seats text,
    plate_number text,
    plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow',
    can_issue_tax_invoice boolean default false,
    business_type text default 'individual',
    service_type text default 'with_driver',
    deposit_terms text,
    amenities text,
    pickup_location text,
    routes text,
    status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
    created_at timestamptz default now()
);

create index if not exists idx_driver_leads_status on public.driver_leads(status);
create index if not exists idx_driver_leads_created_at on public.driver_leads(created_at desc);

-- ------------------------------------------------------------------------------
-- 4. TABLE: vehicles (ข้อมูลรถตู้ VIP / รถบริการพร้อมคนขับ)
-- ------------------------------------------------------------------------------
create table if not exists public.vehicles (
    id text primary key,
    title text not null,
    type text not null check (type in ('van', 'car', 'suv')),
    seats integer not null,
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
    plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow',
    plate_number text,
    can_issue_tax_invoice boolean default false,
    business_type text default 'individual',
    is_available boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_vehicles_type on public.vehicles(type);
create index if not exists idx_vehicles_is_verified on public.vehicles(is_verified);
create index if not exists idx_vehicles_region on public.vehicles(region);
create index if not exists idx_vehicles_is_available on public.vehicles(is_available);

-- ------------------------------------------------------------------------------
-- 5. TABLE: board_posts (กระดานเว็บบอร์ด หาคนหาร / หารถตู้เที่ยว)
-- ------------------------------------------------------------------------------
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
    vehicle_label text,
    detail text default '',
    posted_at text default 'เมื่อสักครู่',
    is_verified boolean default false,
    category text default 'general' check (category in ('general', 'corporate')),
    pin text,
    is_closed boolean default false,
    created_at timestamptz default now()
);

create index if not exists idx_board_posts_type on public.board_posts(type);
create index if not exists idx_board_posts_zone_id on public.board_posts(zone_id);
create index if not exists idx_board_posts_created_at on public.board_posts(created_at desc);
create index if not exists idx_board_posts_category on public.board_posts(category);

-- ------------------------------------------------------------------------------
-- 6. TABLE: analytics_events (สถิติการใช้งาน และ Click-to-Contact)
-- ------------------------------------------------------------------------------
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

create index if not exists idx_analytics_events_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);

-- ------------------------------------------------------------------------------
-- 7. TABLE: sponsors (ผู้สนับสนุน และแบนเนอร์พันธมิตร)
-- ------------------------------------------------------------------------------
create table if not exists public.sponsors (
    id text primary key,
    title text not null,
    category text not null, -- 'hotel' | 'auto_service' | 'restaurant' | 'activity' | 'tour' | 'cooking'
    category_label text not null,
    tagline text,
    badge_text text,
    image text not null,
    link text not null,
    discount_text text,
    location text,
    created_at timestamptz default now()
);

create index if not exists idx_sponsors_category on public.sponsors(category);

-- ------------------------------------------------------------------------------
-- 7. PUSH SUBSCRIPTIONS TABLE (ระบบการแจ้งเตือน Web Push)
-- ------------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
    id text primary key,
    endpoint text unique not null,
    p256dh text not null,
    auth text not null,
    role text default 'driver',
    created_at timestamptz default now()
);

create index if not exists idx_push_sub_role on public.push_subscriptions(role);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.quotations enable row level security;
alter table public.driver_leads enable row level security;
alter table public.vehicles enable row level security;
alter table public.board_posts enable row level security;
alter table public.analytics_events enable row level security;
alter table public.sponsors enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Allow public select on push_subscriptions"
    on public.push_subscriptions for select
    using (true);

create policy "Allow public insert on push_subscriptions"
    on public.push_subscriptions for insert
    with check (true);

create policy "Allow public delete on push_subscriptions"
    on public.push_subscriptions for delete
    using (true);

-- Quotations policies
create policy "Allow public insert on quotations"
    on public.quotations for insert
    with check (true);

create policy "Allow public select on quotations"
    on public.quotations for select
    using (true);

create policy "Allow public update on quotations"
    on public.quotations for update
    using (true);

create policy "Allow public delete on quotations"
    on public.quotations for delete
    using (true);

-- Driver leads policies
create policy "Allow public insert on driver_leads"
    on public.driver_leads for insert
    with check (true);

create policy "Allow public select on driver_leads"
    on public.driver_leads for select
    using (true);

create policy "Allow public update on driver_leads"
    on public.driver_leads for update
    using (true);

create policy "Allow public delete on driver_leads"
    on public.driver_leads for delete
    using (true);

-- Vehicles policies
create policy "Allow public select on vehicles"
    on public.vehicles for select
    using (true);

create policy "Allow public insert on vehicles"
    on public.vehicles for insert
    with check (true);

create policy "Allow public update on vehicles"
    on public.vehicles for update
    using (true);

create policy "Allow public delete on vehicles"
    on public.vehicles for delete
    using (true);

-- Board posts policies
create policy "Allow public select on board_posts"
    on public.board_posts for select
    using (true);

create policy "Allow public insert on board_posts"
    on public.board_posts for insert
    with check (true);

create policy "Allow public update on board_posts"
    on public.board_posts for update
    using (true);

create policy "Allow public delete on board_posts"
    on public.board_posts for delete
    using (true);

-- Sponsors policies
create policy "Allow public select on sponsors"
    on public.sponsors for select
    using (true);

create policy "Allow public insert on sponsors"
    on public.sponsors for insert
    with check (true);

create policy "Allow public update on sponsors"
    on public.sponsors for update
    using (true);

create policy "Allow public delete on sponsors"
    on public.sponsors for delete
    using (true);

-- Analytics events policies
create policy "Allow public insert on analytics_events"
    on public.analytics_events for insert
    with check (true);

create policy "Allow public select on analytics_events"
    on public.analytics_events for select
    using (true);

-- ------------------------------------------------------------------------------
-- 8. MIGRATION: ALTER EXISTING TABLES (SAFE UPGRADE FOR EXISTING DATABASES)
-- ------------------------------------------------------------------------------
alter table public.vehicles add column if not exists plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow';
alter table public.vehicles add column if not exists plate_number text;
alter table public.vehicles add column if not exists can_issue_tax_invoice boolean default false;
alter table public.vehicles add column if not exists business_type text default 'individual';
alter table public.vehicles add column if not exists is_available boolean default true;
alter table public.vehicles add column if not exists updated_at timestamptz default now();

alter table public.driver_leads add column if not exists plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow';
alter table public.driver_leads add column if not exists can_issue_tax_invoice boolean default false;
alter table public.driver_leads add column if not exists business_type text default 'individual';
alter table public.driver_leads add column if not exists service_type text default 'with_driver';
alter table public.driver_leads add column if not exists deposit_terms text;
alter table public.driver_leads add column if not exists amenities text;
alter table public.driver_leads add column if not exists pickup_location text;

alter table public.board_posts add column if not exists category text default 'general';
alter table public.board_posts add column if not exists pin text;
alter table public.board_posts add column if not exists is_closed boolean default false;

-- ------------------------------------------------------------------------------
-- 9. INITIAL SEED DATA & PILOT DRIVERS (ข้อมูลเริ่มต้นและกลุ่มรถจริงนำร่อง)
-- ------------------------------------------------------------------------------

-- Seed Quotations
insert into public.quotations (id, company_name, contact_name, phone, travel_date, route, passengers, needs_tax_invoice, estimated_price, status, created_at)
values
    ('qt-101', 'บจก. สยามอินโนเวชั่น เทรดดิ้ง (กทม.)', 'คุณวรัญญา (ฝ่ายจัดซื้อ)', '081-998-7766', '15-17 ธ.ค. 2569', 'สนามบินเชียงใหม่ - นิมมาน - ม่อนแจ่ม (3 วัน 2 คืน)', '15-20 คน (รถตู้ 2 คัน)', true, 12500, 'pending', now() - interval '2 days'),
    ('qt-102', 'สำนักงานส่งเสริมเศรษฐกิจดิจิทัล (สาขาภาคเหนือ)', 'คุณภานุเดช', '053-241-555', '2-4 พ.ย. 2569', 'ศูนย์ประชุมนานาชาติเชียงใหม่ - อ่างขาง', '25-30 คน (รถตู้ 3 คัน)', true, 22000, 'quoted', now() - interval '3 days')
on conflict (id) do nothing;

-- Seed Driver Leads
insert into public.driver_leads (id, driver_name, nickname, phone, line_id, vehicle_model, seats, plate_number, routes, status, created_at)
values
    ('drv-lead-01', 'นายกิตติศักดิ์ ศรีล้านนา', 'พี่เอก เชียงใหม่แวน', '089-876-5432', 'ake_van_cm', 'Toyota All New Commuter 10 ที่นั่ง', '10', 'นข-4521 ชม.', 'ม่อนแจ่ม, ดอยอินทนนท์, แม่กำปอง, เชียงราย', 'pending', now() - interval '1 day')
on conflict (id) do nothing;

-- Seed Vehicles
insert into public.vehicles (id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp, driver_wechat, driver_kakao, languages, region, rating, review_count, is_verified, images, zone_rates, rate_note, location, popular_routes, amenities, description)
values
(
    'v-1',
    'Toyota Commuter VIP 9 ที่นั่ง เบาะนวดไฟฟ้า คาราโอเกะจัดเต็ม',
    'van',
    9,
    'นายสุรชัย ใจดี',
    'พี่ชัย รถตู้เชียงใหม่',
    '081-234-5678',
    'https://line.me',
    'https://wa.me/66812345678',
    'chaicnx_van',
    'chaivan_cnx',
    array['th', 'en'],
    'north',
    4.9,
    48,
    true,
    array['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'],
    '{"city": 1900, "midHill": 2100, "highHill": 2300, "crossProvince": 2700}'::jsonb,
    null,
    'เชียงใหม่ / ม่อนแจ่ม / ดอยอินทนนท์ / ภาคเหนือ',
    array['ม่อนแจ่ม', 'ดอยอินทนนท์', 'แม่กำปอง', 'เชียงใหม่', 'เชียงราย'],
    array['เบาะนวดปรับไฟฟ้า 9 ที่นั่ง', 'ชุดคาราโอเกะ + YouTube Smart TV', 'WiFi ความเร็วสูงบนรถ', 'ที่ชาร์จ Type-C / USB ทุกที่นั่ง', 'ประกันภัยผู้โดยสารชั้น 1', 'ตู้เย็นขนาดเล็กบนรถ'],
    'รถตู้ตกแต่ง VIP สภาพใหม่เอี่ยม แอร์เย็นฉ่ำ เบาะนวดสบาย เหมาะสำหรับทริปครอบครัว ผู้บริหาร และกลุ่มเพื่อน คนขับชำนาญเส้นทางดอยสูง ปลอดภัย สื่อสารภาษาอังกฤษพื้นฐานได้ ไม่สูบบุหรี่'
),
(
    'v-2',
    'Toyota Majesty Executive 7 ที่นั่ง เบาะ Captain Seat พรีเมียม (กทม. & พัทยา & หัวหิน)',
    'van',
    7,
    'นายวรพจน์ กานต์ธนา',
    'พี่พจน์ VIP Limo',
    '086-555-1234',
    'https://line.me',
    'https://wa.me/66865551234',
    'bkk_limo_vip',
    null,
    array['th', 'en', 'zh'],
    'central',
    5.0,
    42,
    true,
    array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'],
    '{"city": 3200, "midHill": 3400, "highHill": 3600, "crossProvince": 4000}'::jsonb,
    'รุ่นพรีเมียมผู้บริหาร ออกใบกำกับภาษีเต็มรูปได้',
    'กรุงเทพฯ & ปริมณฑล / พัทยา / หัวหิน / อยุธยา',
    array['กรุงเทพฯ', 'พัทยา', 'หัวหิน', 'อยุธยา', 'สนามบินสุวรรณภูมิ'],
    array['เบาะ Captain Seat ปรับไฟฟ้าคู่หน้า', 'ประตูสไลด์ไฟฟ้าสองฝั่ง', 'ระบบฟอกอากาศ Nanoe', 'คนขับสื่อสารภาษาอังกฤษและจีนได้', 'รองรับการออกใบกำกับภาษีเต็มรูปแบบ'],
    'ระดับพรีเมียมสำหรับรับรองแขก VIP ลูกค้าองค์กร ชาวต่างชาติ หรือทริปครอบครัวที่ต้องการความหรูหราและความเป็นส่วนตัวสูงสุด ออกใบกำกับภาษีในนามบริษัทได้'
),
(
    'v-3',
    'All New Commuter VIP 10 ที่นั่ง หลังคาสูง (ภูเก็ต & พังงา & กระบี่)',
    'van',
    10,
    'นายเอกชัย อันดามัน',
    'โกเอก รถตู้ภูเก็ต VIP',
    '089-876-5432',
    'https://line.me',
    'https://wa.me/66898765432',
    'phuket_andaman_van',
    'phuketvan88',
    array['th', 'en'],
    'south',
    4.9,
    56,
    true,
    array['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'],
    '{"city": 2000, "midHill": 2200, "highHill": 2500, "crossProvince": 2800}'::jsonb,
    null,
    'ภูเก็ต / กระบี่ / พังงา / เขาหลัก',
    array['ภูเก็ต', 'พังงา', 'กระบี่', 'สนามบินภูเก็ต'],
    array['เบาะ VIP 10 ที่นั่ง กว้างขวาง', 'จอเพดาน Android TV + คาราโอเกะ', 'ช่องชาร์จโทรศัพท์ทุกที่นั่ง', 'ประกันภัยผู้โดยสารชั้น 1', 'คนขับชำนาญเส้นทางแหล่งท่องเที่ยวอันดามัน'],
    'รถตู้ VIP สภาพใหม่เอี่ยม เบาะหนังแท้นุ่มสบาย ระบบแอร์เย็นฉ่ำทั่วคัน เหมาะสำหรับรับส่งสนามบินภูเก็ต ทริปเที่ยวอ่าวพังงา เกาะพีพี หรือข้ามไปกระบี่และเขาหลัก'
),
(
    'v-4',
    'Hyundai Staria VIP 9 ที่นั่ง โมเดิร์นลักชัวรี่ (พัทยา & ชลบุรี & ระยอง)',
    'van',
    9,
    'นายยุทธนา ชลประทาน',
    'พี่ยุทธ พัทยาทราเวล',
    '082-333-4455',
    'https://line.me',
    'https://wa.me/66823334455',
    null,
    'pattaya_staria',
    array['th', 'en', 'ko'],
    'east',
    4.9,
    38,
    true,
    array['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
    '{"city": 2400, "midHill": 2600, "highHill": 2900, "crossProvince": 3300}'::jsonb,
    null,
    'พัทยา / ชลบุรี / สัตหีบ / ระยอง / เกาะช้าง',
    array['พัทยา', 'สัตหีบ', 'ระยอง', 'เกาะช้าง', 'สนามบินอู่ตะเภา'],
    array['ห้องโดยสารสไตล์ยานอวกาศ หน้าต่างกว้างพาโนรามา', 'เบาะนวด Relaxing Seat ปรับเอนไฟฟ้า', 'คนขับสื่อสารภาษาอังกฤษและเกาหลีได้', 'กล้อง 360 องศา ระบบความปลอดภัยครบ', 'ออกใบเสร็จรับเงิน/ใบกำกับภาษีได้'],
    'รถตู้ดีไซน์ล้ำสมัยระดับพรีเมียม ขับนุ่มนวล เงียบสงบ เหมาะสำหรับนักธุรกิจ ทริปตีกอล์ฟ และครอบครัวที่มาพักผ่อนพัทยาและระยอง คนขับสุภาพ ตรงต่อเวลา'
),
(
    'v-5',
    'Toyota Fortuner 4WD 7 ที่นั่ง ลุยธรรมชาติ (เขาใหญ่ & โคราช & อีสาน)',
    'suv',
    7,
    'นายโชคชัย สุวรรณภูมิ',
    'พี่โชค เขาใหญ่ทัวร์',
    '085-111-2233',
    'https://line.me',
    'https://wa.me/66851112233',
    null,
    null,
    array['th', 'en'],
    'isan',
    4.8,
    45,
    true,
    array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    '{"city": 1800, "midHill": 2000, "highHill": 2200, "crossProvince": 2600}'::jsonb,
    null,
    'เขาใหญ่ / ปากช่อง / นครราชสีมา / ขอนแก่น',
    array['เขาใหญ่', 'ปากช่อง', 'วังน้ำเขียว', 'ขอนแก่น'],
    array['ระบบขับเคลื่อน 4 ล้อ ลุยเส้นทางธรรมชาติสบาย', 'Apple CarPlay / Android Auto', 'ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร', 'พร้อมคนขับชำนาญทางเขาใหญ่-วังน้ำเขียว'],
    'รถ SUV 7 ที่นั่ง ขับเคลื่อน 4 ล้อ ยกสูง สมรรถนะดีเยี่ยม เหมาะสำหรับเส้นทางขึ้นเขา ท่องเที่ยวอุทยานแห่งชาติเขาใหญ่ และสถานที่ท่องเที่ยวธรรมชาติแถบอีสาน'
)
on conflict (id) do nothing;

-- Seed Board Posts
insert into public.board_posts (id, type, title, zone_id, date, days, seats, price, price_note, author_name, author_phone, author_line, vehicle_label, detail, posted_at, is_verified, created_at)
values
(
    'b-1',
    'request',
    'หารถตู้ 9 ที่นั่ง ไปม่อนแจ่ม-แม่ริม 2 วัน 1 คืน',
    'midHill',
    '20-21 ก.ย. 69',
    2,
    8,
    4500,
    'งบรวมน้ำมัน',
    'คุณนิดา (ครอบครัว 8 คน)',
    '082-111-2233',
    'https://line.me',
    null,
    'รับที่สนามบินเชียงใหม่เช้าวันแรก เที่ยวม่อนแจ่ม สวนส้ม แม่ริม ค้างม่อนแจ่ม 1 คืน ขอรถมีคาราโอเกะให้เด็กๆ',
    '15 นาทีที่แล้ว',
    false,
    now() - interval '15 minutes'
),
(
    'b-2',
    'share',
    'หาเพื่อนร่วมทริปดอยอินทนนท์ 22 ก.ย. เหลือ 2 ที่นั่ง',
    'highHill',
    '22 ก.ย. 69',
    1,
    2,
    700,
    'หารกันต่อคน รวมน้ำมันแล้ว',
    'คุณเมย์ (เหมารถแล้ว เหลือ 2 ที่)',
    '089-876-5432',
    'https://line.me',
    null,
    'จัดรถตู้ VIP กับคนขับแล้ว เหลือที่ว่าง 2 ที่ ออกเช้าจากแม่ริม ขึ้นกิ่วแม่ปาน พระมหาธาตุฯ น้ำตกวชิรธาร ใครสะดวกไปด้วยกันทักมาได้ หารค่ารถคนละประมาณ 700 บาท',
    '1 ชม. ที่แล้ว',
    true,
    now() - interval '1 hour'
),
(
    'b-3',
    'request',
    'หารถรับ-ส่งสนามบิน + เที่ยวในเมือง 1 วัน งบ 2,000',
    'city',
    '25 ก.ย. 69',
    1,
    5,
    2000,
    'งบรวมทุกอย่าง',
    'คุณมาร์ค (นักท่องเที่ยว 5 คน)',
    '083-444-5566',
    'https://line.me',
    null,
    'ไฟลต์ถึง 09:00 เที่ยววัดพระธาตุดอยสุเทพ นิมมาน คลองแม่ข่า ส่งโรงแรมในเมืองตอนเย็น กระเป๋าใบใหญ่ 5 ใบ',
    '3 ชม. ที่แล้ว',
    false,
    now() - interval '3 hours'
),
(
    'b-4',
    'share',
    'หาเพื่อนร่วมทางเชียงราย 27 ก.ย. เหลือ 2 ที่นั่ง',
    'crossProvince',
    '27 ก.ย. 69',
    1,
    2,
    900,
    'หารกันต่อคน รวมน้ำมันแล้ว',
    'คุณบอล (เหมารถ Fortuner แล้ว)',
    '081-234-5678',
    'https://line.me',
    null,
    'เหมารถ Fortuner 4WD วันเดย์เชียงรายแล้ว เหลือว่าง 2 ที่ วัดร่องขุ่น วัดร่องเสือเต้น ไร่ชาฉุยฟง ออก 07:00 กลับไม่เกิน 20:00 ใครสะดวกไปด้วยกันทักมาได้ หารกันคนละประมาณ 900 บาท',
    'เมื่อวาน',
    true,
    now() - interval '1 day'
),
(
    'b-5',
    'request',
    'หารถตู้ 2 คัน รับคณะดูงานแม่กำปอง ไป-กลับวันเดียว',
    'midHill',
    '30 ก.ย. 69',
    1,
    18,
    4400,
    'งบต่อ 2 คัน ไม่รวมน้ำมัน',
    'อบต. สันทราย (คณะ 18 ท่าน)',
    '053-777-888',
    'https://line.me',
    null,
    'คณะศึกษาดูงานหมู่บ้านแม่กำปอง ต้องการรถตู้ 2 คันรุ่นใกล้เคียงกัน ขอใบเสร็จรับเงินเพื่อเบิกงบได้',
    'เมื่อวาน',
    false,
    now() - interval '1 day'
),
(
    'b-6',
    'share',
    'หาเพื่อนร่วมทริปสนามบิน+ประชุมในเมือง 21 ก.ย. เหลือ 2 ที่',
    'city',
    '21 ก.ย. 69',
    1,
    2,
    800,
    'หารกันต่อคน',
    'คุณเป้ (จอง Majesty แล้ว)',
    '086-555-1234',
    'https://line.me',
    null,
    'จอง Majesty รับ-ส่งสนามบินตระเวนประชุมทั้งวันแล้ว เหลือว่าง 2 ที่ นั่งสบาย ออกใบเสร็จได้ ใครจะร่วมทริปทักมาได้ หารกันคนละประมาณ 800 บาท',
    '2 วันที่แล้ว',
    true,
    now() - interval '2 days'
)
on conflict (id) do nothing;

-- Seed Sponsors
insert into public.sponsors (id, title, category, category_label, tagline, badge_text, image, link, discount_text, location)
values
(
    'sp-7',
    'The Connect Chiang Mai (เดอะ คอนเน็ค เชียงใหม่)',
    'hotel',
    'ที่พักแนะนำพันธมิตร',
    'ห้องพักรายวันและรายเดือนสไตล์โมเดิร์นลอฟท์ เงียบสงบ ใกล้สนามบินเชียงใหม่และเซ็นทรัลแอร์พอร์ต พร้อมคาเฟ่ Coffee Connect และที่จอดรถ',
    'ที่พักใกล้สนามบิน เชียงใหม่',
    '/images/the-connect-chiangmai.jpg',
    'https://www.facebook.com/Theconnectchiangmai',
    'ห้องพักสะอาด บรรยากาศเป็นกันเอง พร้อมคาเฟ่ในตัวและที่จอดรถสะดวกสบาย',
    'ต.แม่เหียะ อ.เมือง จ.เชียงใหม่ (ใกล้สนามบินนานาชาติเชียงใหม่)'
),
(
    'sp-8',
    'บ้านทิพย์ - พูลวิลล่าริมน้ำสวยงาม (Baan Thip Villa)',
    'hotel',
    'พูลวิลล่าริมน้ำ',
    'วิลล่าพักผ่อนริมน้ำ 4 ห้องนอน สระว่ายน้ำส่วนตัวและสวนสีเขียวขนาดใหญ่ ออกแบบโดยสถาปนิก เหมาะสำหรับครอบครัวและกลุ่มเพื่อน',
    'พูลวิลล่าริมน้ำ เชียงใหม่ ★4.85',
    '/images/baan-thip-villa.jpg',
    'https://th.airbnb.com/rooms/32648518',
    'วิลล่าทั้งหลัง 4 ห้องนอน 4 เตียง สระว่ายน้ำส่วนตัวริมน้ำปิง',
    'ริมแม่น้ำ อ.เมืองเชียงใหม่ จ.เชียงใหม่'
),
(
    'sp-9',
    'บ้านศรีธา - บ้านไม้ที่มีเสน่ห์ในเมือง (Baan Sri Dha)',
    'hotel',
    'บ้านพักไม้ทรงเสน่ห์',
    'บ้านกึ่งไม้ทั้งหลัง 5 ห้องนอน รองรับ 9 คน ใกล้ประตูเชียงใหม่และถนนคนเดินวัวลาย พร้อมอาหารเช้าโฮมเมดและบริการรถรับส่งฟรี',
    'ที่พักติดอันดับท็อป 1% ★4.94',
    '/images/baan-sri-dha.jpg',
    'https://th.airbnb.com/rooms/9056914',
    'บ้านทั้งหลัง 5 ห้องนอน 5 เตียง ฟรีอาหารเช้าและรถรับส่งสนามบิน',
    'ต.หายยา อ.เมืองเชียงใหม่ (ใกล้ประตูเชียงใหม่ & ถนนคนเดินวัวลาย)'
),
(
    'sp-10',
    'อพาร์ทเมนท์ล้านนา - ที่พัก 5 ห้องนอนกว้างขวางกลางเมืองเชียงใหม่ (Lanna Apartment)',
    'hotel',
    'ที่พัก 5 ห้องนอนในเมือง',
    'ชั้น 1 ของอาคารส่วนตัวทั้งชั้น ห้องนอน 5 ห้อง ห้องน้ำในตัวทุกห้อง เครื่องปรับอากาศทุกห้อง ห้องนั่งเล่นล้อมรอบ 3 ห้อง และลานกลางแจ้ง เหมาะกับครอบครัวและกลุ่มเพื่อนที่รองรับได้ถึง 10 คน',
    'ที่พักติดอันดับท็อป 10% ★4.96',
    '/images/lanna-riverside-home.jpg',
    'https://th.airbnb.com/rooms/957661325183385971',
    'รถรับส่งสนามบินฟรี · อาหารเช้าเสริม · Wi-Fi ใยแก้วนำแสง 287 Mbps · ที่จอดรถฟรี',
    'ต.หายยา อ.เมืองเชียงใหม่ (เดิน 6 นาทีถึงตลาดประตูเชียงใหม่)'
),
(
    'sp-11',
    'บ้านศรีธา - บ้านสไตล์ล้านนาและโยคะ (Baan Sri Dha Lanna & Yoga)',
    'hotel',
    'บ้านพักสไตล์ล้านนา & โยคะ',
    'บ้านเดี่ยวไม้สักสไตล์ล้านนา 3 ห้องนอน 3 ห้องน้ำ รองรับ 5 คน พื้นที่สีเขียวและลานโยคะส่วนตัว ใกล้ตลาดประตูเชียงใหม่ พร้อมอาหารเช้าโฮมเมดและบริการรถรับส่งสนามบินฟรี',
    'โดนใจเกสต์ ★4.96 (477 รีวิว)',
    '/images/baan-sri-dha-yoga.jpg',
    'https://th.airbnb.com/rooms/17126437',
    'บ้านทั้งหลัง 3 ห้องนอน 3 ห้องน้ำ ฟรีอาหารเช้าปรุงสด + รถรับส่งสนามบิน',
    'ต.หายยา อ.เมืองเชียงใหม่ (เดิน 6-10 นาทีถึงตลาดประตูเชียงใหม่ & ถนนคนเดินวัวลาย)'
),
(
    'sp-12',
    'Sukjai Home Cooking School (สุขใจ โฮม คุกกิ้ง สคูล เชียงใหม่)',
    'cooking',
    'เวิร์กชอปทำอาหารไทย',
    'คอร์สเรียนทำอาหารไทยสไตล์โฮมเมด บรรยากาศอบอุ่นในสวนชนบท พร้อมพาเดินตลาดสดเลือกซื้อวัตถุดิบ เมนูยอดนิยม ข้าวซอย ต้มยำ ผัดไทย และรถรับส่งฟรี',
    'เวิร์กชอปทำอาหาร เชียงใหม่',
    '/images/sukjai-cooking-school.jpg',
    'https://www.facebook.com/profile.php?id=61558094176601',
    'คอร์สทำอาหารไทยแท้ บรรยากาศสวนชนบท พร้อมพาชมตลาดและรถรับส่ง',
    'เชียงใหม่ (มีบริการรถรับส่งจากตัวเมือง)'
)
on conflict (id) do nothing;

