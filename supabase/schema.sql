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
    vehicle_model text,
    seats text,
    plate_number text,
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
    created_at timestamptz default now()
);

create index if not exists idx_vehicles_type on public.vehicles(type);
create index if not exists idx_vehicles_is_verified on public.vehicles(is_verified);
create index if not exists idx_vehicles_region on public.vehicles(region);

-- ------------------------------------------------------------------------------
-- 5. TABLE: board_posts (กระดานเว็บบอร์ด หาคนหาร / หารถตู้เที่ยว)
-- ------------------------------------------------------------------------------
create table if not exists public.board_posts (
    id text primary key default ('b-' || substr(md5(random()::text), 1, 8)),
    type text not null check (type in ('request', 'offer')),
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
    detail text not null,
    posted_at text default 'เมื่อสักครู่',
    is_verified boolean default false,
    created_at timestamptz default now()
);

create index if not exists idx_board_posts_type on public.board_posts(type);
create index if not exists idx_board_posts_zone_id on public.board_posts(zone_id);
create index if not exists idx_board_posts_created_at on public.board_posts(created_at desc);

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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.quotations enable row level security;
alter table public.driver_leads enable row level security;
alter table public.vehicles enable row level security;
alter table public.board_posts enable row level security;
alter table public.analytics_events enable row level security;

-- Quotations policies: anyone can create quote request; anyone can read for portal
create policy "Allow public insert on quotations"
    on public.quotations for insert
    with check (true);

create policy "Allow public select on quotations"
    on public.quotations for select
    using (true);

create policy "Allow public update on quotations"
    on public.quotations for update
    using (true);

-- Driver leads policies: anyone can apply; portal can read & verify
create policy "Allow public insert on driver_leads"
    on public.driver_leads for insert
    with check (true);

create policy "Allow public select on driver_leads"
    on public.driver_leads for select
    using (true);

create policy "Allow public update on driver_leads"
    on public.driver_leads for update
    using (true);

-- Vehicles policies: anyone can view vehicles; authenticated/anon can insert for seeding
create policy "Allow public select on vehicles"
    on public.vehicles for select
    using (true);

create policy "Allow public insert on vehicles"
    on public.vehicles for insert
    with check (true);

create policy "Allow public update on vehicles"
    on public.vehicles for update
    using (true);

-- Board posts policies: anyone can read and post
create policy "Allow public select on board_posts"
    on public.board_posts for select
    using (true);

create policy "Allow public insert on board_posts"
    on public.board_posts for insert
    with check (true);

-- Analytics events policies: anyone can submit tracking events
create policy "Allow public insert on analytics_events"
    on public.analytics_events for insert
    with check (true);

create policy "Allow public select on analytics_events"
    on public.analytics_events for select
    using (true);

-- ------------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (ข้อมูลเริ่มต้น)
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
    'offer',
    'ว่าง! รถตู้ VIP 10 ที่นั่ง รับทริปดอยอินทนนท์วันเดย์',
    'highHill',
    '22 ก.ย. 69',
    1,
    10,
    2300,
    'ไม่รวมน้ำมัน',
    'พี่เอก เชียงใหม่ทราเวล',
    '089-876-5432',
    'https://line.me',
    'All New Commuter 10 ที่นั่ง',
    'ว่างวันจันทน์ที่ 22 รับได้ 1 ทริป เส้นทางกิ่วแม่ปาน พระมหาธาตุฯ น้ำตกวชิรธาร ชำนาญทางดอย ออกเช้า 07:30 กลับถึงเมือง 18:00',
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
    'offer',
    'ว่าง! Fortuner 4WD พร้อมคนขับ ทริปเชียงรายวันเดย์',
    'crossProvince',
    '27 ก.ย. 69',
    1,
    4,
    2800,
    'รวมน้ำมันแล้ว',
    'พี่ชัย รถตู้เชียงใหม่',
    '081-234-5678',
    'https://line.me',
    'Toyota Fortuner 4WD 7 ที่นั่ง',
    'วัดร่องขุ่น วัดร่องเสือเต้น ไร่ชาฉุยฟง ออก 07:00 กลับถึงเชียงใหม่ไม่เกิน 20:00 นั่งสบายไม่เกิน 4 ท่าน',
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
    'offer',
    'ว่าง! Majesty ผู้บริหาร รับ-ส่งสนามบิน + ประชุมในเมือง',
    'city',
    '21 ก.ย. 69',
    1,
    6,
    3200,
    'รวมคนขับ ไม่รวมน้ำมัน',
    'พี่พจน์ VIP Limo',
    '086-555-1234',
    'https://line.me',
    'Toyota Majesty Executive 7 ที่นั่ง',
    'รถหรู VIP Captain Seat สำหรับรับผู้บริหาร ประชุม สัมมนา ออกใบกำกับภาษีได้',
    '2 วันที่แล้ว',
    true,
    now() - interval '2 days'
)
on conflict (id) do nothing;
