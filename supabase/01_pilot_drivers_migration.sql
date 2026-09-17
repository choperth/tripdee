-- ==============================================================================
-- TripDee (ทริปดี) - Pilot Drivers & Schema Upgrade Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. UPGRADE VEHICLES TABLE
alter table if exists public.vehicles add column if not exists plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow';
alter table if exists public.vehicles add column if not exists plate_number text;
alter table if exists public.vehicles add column if not exists can_issue_tax_invoice boolean default false;
alter table if exists public.vehicles add column if not exists business_type text default 'individual';
alter table if exists public.vehicles add column if not exists is_available boolean default true;
alter table if exists public.vehicles add column if not exists rental_type text default 'with_driver';
alter table if exists public.vehicles add column if not exists transmission text default 'auto';
alter table if exists public.vehicles add column if not exists updated_at timestamptz default now();

create index if not exists idx_vehicles_is_available on public.vehicles(is_available);
create index if not exists idx_vehicles_rental_type on public.vehicles(rental_type);
create index if not exists idx_vehicles_plate_type on public.vehicles(plate_type);

-- 2. UPGRADE DRIVER LEADS TABLE
alter table if exists public.driver_leads add column if not exists plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow';
alter table if exists public.driver_leads add column if not exists can_issue_tax_invoice boolean default false;
alter table if exists public.driver_leads add column if not exists business_type text default 'individual';
alter table if exists public.driver_leads add column if not exists service_type text default 'with_driver';
alter table if exists public.driver_leads add column if not exists deposit_terms text;
alter table if exists public.driver_leads add column if not exists amenities text;
alter table if exists public.driver_leads add column if not exists pickup_location text;

-- 3. UPGRADE TRIP BOARD POSTS TABLE
alter table if exists public.board_posts add column if not exists category text default 'general' check (category in ('general', 'corporate'));
alter table if exists public.board_posts add column if not exists pin text;
alter table if exists public.board_posts add column if not exists is_closed boolean default false;

create index if not exists idx_board_posts_category on public.board_posts(category);

-- ==============================================================================
-- 4. INSERT REAL PILOT DRIVERS (กลุ่มรถจริงนำร่องชุดแรก - เชียงใหม่และภาคเหนือ)
-- ==============================================================================

-- Pilot 1: พี่เอก เชียงใหม่แวน (All New Commuter VIP 9 ที่นั่ง - ป้ายเหลือง 30)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available
) values (
    'v-pilot-cm01',
    'All New Commuter VIP 9 ที่นั่ง เบาะนวดไฟฟ้า คาราโอเกะ YouTube (พี่เอก)',
    'van',
    9,
    'นายกิตติศักดิ์ ศรีล้านนา',
    'พี่เอก เชียงใหม่แวน',
    '089-876-5432',
    'https://line.me/ti/p/~ake_van_cm',
    'https://wa.me/66898765432',
    array['th', 'en'],
    5.0,
    64,
    true,
    array[
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
    ],
    '{"city": 1900, "midHill": 2100, "highHill": 2300, "crossProvince": 2700}'::jsonb,
    'ราคารวมคนขับและประกันภัยชั้น 1 ไม่รวมน้ำมัน (มัดจำ 20-30% เพื่อล็อคคิว)',
    'เชียงใหม่ / ม่อนแจ่ม / ดอยอินทนนท์ / แม่กำปอง / เชียงราย',
    'north',
    array['ม่อนแจ่ม', 'ดอยอินทนนท์', 'แม่กำปอง', 'เชียงใหม่', 'เชียงราย'],
    array[
        'เบาะ VIP ปรับไฟฟ้า 9 ที่นั่ง นุ่มสบาย',
        'ชุดคาราโอเกะ Android TV + ไมค์ลอย',
        'WiFi 5G ความเร็วสูงบนรถ',
        'ช่องชาร์จ Type-C และ USB ทุกที่นั่ง',
        'ประกันภัยคุ้มครองผู้โดยสารชั้น 1',
        'คนขับชำนาญทางขึ้นดอยสูง ปลอดภัย 100%'
    ],
    'รถตู้ All New Commuter หลังคาสูงตกแต่ง VIP สภาพใหม่เอี่ยม เบาะนวดไฟฟ้านุ่มสบาย เหมาะสำหรับทริปครอบครัวและรับรองแขกผู้ใหญ่ คนขับสุภาพ ไม่สูบบุหรี่ ชำนาญเส้นทางดอยสูงและแหล่งท่องเที่ยวภาคเหนือทั้งหมด',
    'yellow',
    '30-1425 ชม.',
    true,
    'company',
    true
) on conflict (id) do update set
    plate_type = excluded.plate_type,
    plate_number = excluded.plate_number,
    can_issue_tax_invoice = excluded.can_issue_tax_invoice,
    is_available = excluded.is_available,
    updated_at = now();

-- Pilot 2: พี่ชัย รถตู้ VIP เชียงใหม่ (Commuter D4D VIP 9 ที่นั่ง - ป้ายฟ้า VIP)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available
) values (
    'v-pilot-cm02',
    'Toyota Commuter VIP 9 ที่นั่ง แอร์เย็นฉ่ำ ดูแลทริปครอบครัว (พี่ชัย)',
    'van',
    9,
    'นายสุรชัย ใจดี',
    'พี่ชัย รถตู้เชียงใหม่',
    '081-234-5678',
    'https://line.me/ti/p/~chaicnx_van',
    'https://wa.me/66812345678',
    array['th', 'en'],
    4.9,
    52,
    true,
    array[
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
    ],
    '{"city": 1900, "midHill": 2100, "highHill": 2300, "crossProvince": 2600}'::jsonb,
    '0% ค่านายหน้า ดีลตรงกับคนขับ โอนมัดจำเข้าบัญชีชื่อนายสุรชัย ใจดี เท่านั้น',
    'เชียงใหม่ / นิมมาน / วัดพระธาตุดอยสุเทพ / แม่ริม',
    'north',
    array['ตัวเมืองเชียงใหม่', 'ดอยสุเทพ', 'แม่ริม', 'ม่อนแจ่ม'],
    array[
        'เบาะ VIP 9 ที่นั่ง หนังแท้ สะอาด',
        'แอร์ไมโครบัสเย็นฉ่ำทั่วคัน',
        'ที่ชาร์จมือถือทุกแถว',
        'ประกันภัยชั้น 1',
        'ช่วยยกสัมภาระและแนะนำร้านอาหารท้องถิ่น'
    ],
    'รถตู้พร้อมคนขับเจ้าของขับเอง ใจเย็น สุภาพ ตรงต่อเวลา ดูแลนักท่องเที่ยวไทยและต่างชาติ ประสบการณ์ขับรถนำเที่ยวเชียงใหม่กว่า 15 ปี ไม่ดื่มแอลกอฮอล์ ไม่สูบบุหรี่',
    'blue',
    'นข-4521 ชม.',
    false,
    'individual',
    true
) on conflict (id) do update set
    plate_type = excluded.plate_type,
    plate_number = excluded.plate_number,
    can_issue_tax_invoice = excluded.can_issue_tax_invoice,
    is_available = excluded.is_available,
    updated_at = now();

-- Pilot 3: พี่สมบูรณ์ Majesty Executive (Toyota Majesty 7 ที่นั่ง - รถตู้ผู้บริหาร ออกบิลบริษัทได้ 100%)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available
) values (
    'v-pilot-cm03',
    'Toyota Majesty Executive 7 ที่นั่ง เบาะ Captain Seat พรีเมียม (พี่สมบูรณ์)',
    'van',
    7,
    'นายสมบูรณ์ วงศ์สว่าง',
    'พี่สมบูรณ์ ล้านนาทราเวล',
    '086-555-1234',
    'https://line.me/ti/p/~somboon_majesty',
    'https://wa.me/66865551234',
    array['th', 'en', 'zh'],
    5.0,
    48,
    true,
    array[
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ],
    '{"city": 3200, "midHill": 3400, "highHill": 3600, "crossProvince": 4000}'::jsonb,
    'ออกใบกำกับภาษีเต็มรูปแบบในนามนิติบุคคลได้ (หัก ณ ที่จ่าย 3%)',
    'เชียงใหม่ / สนามบิน / ศูนย์ประชุมนานาชาติ / ลำพูน / ลำปาง',
    'north',
    array['ศูนย์ประชุมนานาชาติเชียงใหม่', 'สนามบินเชียงใหม่', 'นิมมาน', 'ลำปาง'],
    array[
        'เบาะ Captain Seat ไฟฟ้าคู่หน้าและกลาง',
        'ระบบฟอกอากาศ Nanoe กำจัดกลิ่นและฝุ่น PM2.5',
        'ประตูสไลด์ไฟฟ้าคู่สองฝั่ง',
        'คนขับแต่งกายสุภาพ สื่อสารภาษาอังกฤษและจีนได้',
        'รองรับการออกใบกำกับภาษีและใบเสร็จรับเงิน ภ.พ.20'
    ],
    'ระดับพรีเมียมสูงสุดสำหรับการรับรองแขก VIP ลูกค้าองค์กร ดูงาน สัมมนา และผู้บริหารระดับสูง ขับนุ่มนวล เงียบสงบ เป็นส่วนตัว ออกเอกสารเบิกจ่ายทางบัญชีได้ครบถ้วน',
    'yellow',
    '30-2288 ชม.',
    true,
    'company',
    true
) on conflict (id) do update set
    plate_type = excluded.plate_type,
    plate_number = excluded.plate_number,
    can_issue_tax_invoice = excluded.can_issue_tax_invoice,
    is_available = excluded.is_available,
    updated_at = now();

-- Pilot 4: พี่โชค Fortuner 4WD (Toyota Fortuner 4WD 7 ที่นั่ง - ลุยดอยสูงธรรมชาติ)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available
) values (
    'v-pilot-cm04',
    'Toyota Fortuner 4WD 7 ที่นั่ง ลุยดอยอินทนนท์ อ่างขาง แม่สลอง (พี่โชค)',
    'suv',
    7,
    'นายโชคชัย สุวรรณภูมิ',
    'พี่โชค นอร์ทเทิร์นทริป',
    '085-111-2233',
    'https://line.me/ti/p/~choke_cm_4wd',
    'https://wa.me/66851112233',
    array['th', 'en'],
    4.9,
    41,
    true,
    array[
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    '{"city": 1800, "midHill": 2000, "highHill": 2300, "crossProvince": 2600}'::jsonb,
    'ขับเคลื่อน 4 ล้อ ปลอดภัยทุกสภาพอากาศและทางลาดชัน',
    'เชียงใหม่ / ดอยอ่างขาง / ดอยผ้าห่มปก / เชียงราย / ปาย',
    'north',
    array['ดอยอ่างขาง', 'ดอยอินทนนท์', 'ปาย', 'แม่ฮ่องสอน'],
    array[
        'ระบบขับเคลื่อน 4 ล้อสมบูรณ์แบบ',
        'เบาะหนังแท้ 7 ที่นั่ง',
        'ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร',
        'คนขับชำนาญเส้นทางเขาโค้งและหมอกหนา',
        'มีจุดเสียบชาร์จโทรศัพท์และสาย Aux/Bluetooth'
    ],
    'รถ SUV ขับเคลื่อน 4 ล้อ ยกสูง สมรรถนะยอดเยี่ยม เหมาะสำหรับกลุ่มเพื่อนหรือครอบครัวขนาดเล็ก 4-6 ท่านที่ต้องการเดินทางขึ้นดอยสูง ท่องเที่ยวธรรมชาติ หรือเส้นทางสายหมอกอย่างปลอดภัย',
    'blue',
    'กข-8899 ชม.',
    false,
    'individual',
    true
) on conflict (id) do update set
    plate_type = excluded.plate_type,
    plate_number = excluded.plate_number,
    can_issue_tax_invoice = excluded.can_issue_tax_invoice,
    is_available = excluded.is_available,
    updated_at = now();

-- Pilot 5: พี่เด่น สตาร์เรีย VIP (Hyundai Staria VIP 9 ที่นั่ง - สไตล์โมเดิร์นลักชัวรี่)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available
) values (
    'v-pilot-cm05',
    'Hyundai Staria VIP 9 ที่นั่ง หน้าต่างพาโนรามา พรีเมียมโมเดิร์น (พี่เด่น)',
    'van',
    9,
    'นายเด่นดนัย ล้านนาวิศว์',
    'พี่เด่น สตาร์เรีย VIP',
    '082-333-4455',
    'https://line.me/ti/p/~den_staria_vip',
    'https://wa.me/66823334455',
    array['th', 'en', 'ko'],
    5.0,
    37,
    true,
    array[
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
    ],
    '{"city": 2600, "midHill": 2800, "highHill": 3100, "crossProvince": 3500}'::jsonb,
    'ห้องโดยสารกระจกกว้าง ชมวิวทิวทัศน์เชียงใหม่เต็มตา ออกบิลได้',
    'เชียงใหม่ / แม่ริม / เชียงราย / พะเยา / น่าน',
    'north',
    array['เชียงใหม่', 'แม่ริม', 'เชียงราย', 'น่าน'],
    array[
        'หน้าต่างพาโนรามาบานใหญ่ ชมวิว 360 องศา',
        'เบาะ Relaxing Seat ปรับเอนไฟฟ้า',
        'กล้องมองรอบคันและระบบช่วยขับขี่อัจฉริยะ',
        'คนขับสื่อสารภาษาอังกฤษและเกาหลีพื้นฐานได้',
        'ออกใบเสร็จรับเงิน/ใบกำกับภาษีได้'
    ],
    'ดีไซน์ยานยนต์แห่งอนาคต นุ่มนวล เงียบสนิท หน้าต่างกระจกกว้างพิเศษ เหมาะมากสำหรับนักท่องเที่ยวที่ชื่นชอบการถ่ายภาพและชมวิวภูเขาภาคเหนือ คนขับสุภาพ ตรงต่อเวลา มีความเชี่ยวชาญเส้นทาง',
    'yellow',
    '30-3355 ชม.',
    true,
    'company',
    true
) on conflict (id) do update set
    plate_type = excluded.plate_type,
    plate_number = excluded.plate_number,
    can_issue_tax_invoice = excluded.can_issue_tax_invoice,
    is_available = excluded.is_available,
    updated_at = now();

-- ==============================================================================
-- 5. INSERT SELF-DRIVE PARTNER FLEET (หมวดรถเช่าขับเองในจังหวัดท่องเที่ยว)
-- ==============================================================================

-- Self-Drive 1: ซีเอ็นเอ็กซ์ คาร์เร้นท์ (Toyota Yaris Ativ Sport - เชียงใหม่)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available,
    rental_type, transmission
) values (
    'v-sd-cm01',
    'Toyota Yaris Ativ Sport Eco Car เกียร์ออโต้ 5 ที่นั่ง (ซีเอ็นเอ็กซ์ คาร์เร้นท์)',
    'car',
    5,
    'หจก. ซีเอ็นเอ็กซ์ ทราเวล & คาร์เร้นท์',
    'ซีเอ็นเอ็กซ์ คาร์เร้นท์ (สนามบินเชียงใหม่)',
    '089-755-1122',
    'https://line.me',
    'https://wa.me/66897551122',
    array['th', 'en'],
    4.9,
    52,
    true,
    array['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    '{"city": 850, "midHill": 850, "highHill": 850, "crossProvince": 850}'::jsonb,
    'ราคาเช่าขับเอง 24 ชม. ไม่รวมน้ำมัน (มัดจำและจุดรับรถสอบถามทางร้านโดยตรง)',
    'เชียงใหม่ / สนามบินเชียงใหม่ (CNX) / ตัวเมือง',
    'north',
    array['สนามบินเชียงใหม่', 'นิมมาน', 'แม่ริม', 'ม่อนแจ่ม', 'หางดง'],
    array[
        'เกียร์อัตโนมัติ CVT ขับง่ายประหยัดน้ำมัน',
        'Apple CarPlay / Android Auto พร้อมกล้องถอยหลัง',
        'ระบบแอร์เย็นฉ่ำ สภาพรถใหม่สะอาด',
        'จุดนัดรับโซนสนามบินเชียงใหม่และตัวเมือง',
        'มีประกันภัยรถเช่า (สอบถามประเภทกรมธรรม์กับทางร้าน)'
    ],
    'รถเก๋ง Eco Car สภาพใหม่เอี่ยม สะอาด ประหยัดน้ำมัน คล่องตัวสูง เหมาะสำหรับขับเที่ยวในเมืองเชียงใหม่ แม่ริม หางดง คาเฟ่ ช้อปปิ้ง ติดต่อจองและนัดหมายจุดรับรถกับทางร้านได้โดยตรง',
    'blue',
    'งข-5124 ชม.',
    true,
    'company',
    true,
    'self_drive',
    'auto'
) on conflict (id) do update set
    rental_type = excluded.rental_type,
    transmission = excluded.transmission,
    is_available = excluded.is_available,
    updated_at = now();

-- Self-Drive 2: เชียงใหม่ ออฟโรด & เอสยูวี (Toyota Fortuner 4WD 2.8 - เชียงใหม่)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available,
    rental_type, transmission
) values (
    'v-sd-cm02',
    'Toyota Fortuner 2.8 4WD 7 ที่นั่ง ลุยดอยสูง (เชียงใหม่ ออฟโรด เร้นท์ทอล)',
    'suv',
    7,
    'นายธีรภัทร ยอดดอย',
    'เชียงใหม่ ออฟโรด & เอสยูวี',
    '081-884-3322',
    'https://line.me',
    array['th', 'en'],
    5.0,
    44,
    true,
    array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    '{"city": 2200, "midHill": 2200, "highHill": 2200, "crossProvince": 2200}'::jsonb,
    'ขับเคลื่อน 4 ล้อแท้ สมรรถนะสูง ขึ้นดอยปลอดภัย (สอบถามเงื่อนไขมัดจำกับทางร้าน)',
    'เชียงใหม่ / ดอยอินทนนท์ / อ่างขาง / ปาย',
    'north',
    array['ดอยอินทนนท์', 'ม่อนแจ่ม', 'ดอยอ่างขาง', 'เชียงดาว', 'ปาย'],
    array[
        'ระบบขับเคลื่อน 4 ล้อ (4WD Part-time)',
        'เครื่องยนต์ดีเซล 2.8 เทอร์โบ กำลังขับขึ้นเขาสูงชัน',
        'เบาะหนัง 3 แถว 7 ที่นั่ง พับปรับบรรทุกสัมภาระได้',
        'มีบริการนัดรับรถสนามบินและโรงแรมในตัวเมือง',
        'ประกันภัยรถเช่า (สอบถามรายละเอียดความคุ้มครองกับร้าน)'
    ],
    'รถ SUV ขับเคลื่อน 4 ล้อ พลังแรง ยึดเกาะถนนดีเยี่ยม ออกแบบมาเพื่อการเดินทางท่องเที่ยวขึ้นดอยสูง โค้งชัน และเส้นทางธรรมชาติของภาคเหนือโดยเฉพาะ สภาพรถสมบูรณ์ เช็กศูนย์สม่ำเสมอ',
    'blue',
    'ขข-8942 ชม.',
    false,
    'individual',
    true,
    'self_drive',
    'auto'
) on conflict (id) do update set
    rental_type = excluded.rental_type,
    transmission = excluded.transmission,
    is_available = excluded.is_available,
    updated_at = now();

-- Self-Drive 3: อันดามัน ออโต้เร้นท์ ภูเก็ต (Toyota Yaris Cross HEV - ภูเก็ต)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available,
    rental_type, transmission
) values (
    'v-sd-pkt01',
    'Toyota Yaris Cross HEV Premium Luxury 5 ที่นั่ง (อันดามัน ออโต้เร้นท์ ภูเก็ต)',
    'suv',
    5,
    'บริษัท อันดามัน ออโต้เร้นท์ จำกัด',
    'อันดามัน ออโต้เร้นท์ ภูเก็ต',
    '088-765-4321',
    'https://line.me',
    'https://wa.me/66887654321',
    array['th', 'en', 'zh'],
    4.9,
    68,
    true,
    array['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    '{"city": 1350, "midHill": 1350, "highHill": 1350, "crossProvince": 1350}'::jsonb,
    'Compact SUV ยกสูง ขับเที่ยวรอบเกาะภูเก็ตสะดวก (ติดต่อสอบถามจุดนัดรับ)',
    'ภูเก็ต / สนามบินภูเก็ต (HKT) / ป่าตอง / กะตะ / ตัวเมือง',
    'south',
    array['สนามบินภูเก็ต', 'หาดป่าตอง', 'แหลมพรหมเทพ', 'เมืองเก่าภูเก็ต', 'พังงา'],
    array[
        'Compact SUV ไฮบริด ทัศนวิสัยกว้าง ขับขี่คล่องตัว',
        'เบาะหนังปรับไฟฟ้าและระบบเบรกมือไฟฟ้า Auto Brake Hold',
        'กล้องรอบทิศทาง 360 องศา จอดง่ายแม้ที่แคบ',
        'จุดนัดรับโซนสนามบินภูเก็ตและหาดป่าตอง',
        'เจ้าหน้าที่สื่อสารภาษาอังกฤษและจีนได้'
    ],
    'รถยนต์ Compact SUV รุ่นยอดนิยมในภูเก็ต ยกสูงลุยแอ่งน้ำหรือทางลาดชันบนเกาะได้อย่างมั่นใจ ประหยัดน้ำมันด้วยขุมพลังไฮบริด รับรถสะดวกบริเวณสนามบินภูเก็ตและแหล่งท่องเที่ยวสำคัญ',
    'blue',
    'กพ-6655 ภก.',
    true,
    'company',
    true,
    'self_drive',
    'auto'
) on conflict (id) do update set
    rental_type = excluded.rental_type,
    transmission = excluded.transmission,
    is_available = excluded.is_available,
    updated_at = now();

-- Self-Drive 4: สยาม คาร์ ลิสซิ่ง (Toyota Corolla Altis Hybrid - กทม. & สุวรรณภูมิ/ดอนเมือง)
insert into public.vehicles (
    id, title, type, seats, driver_name, driver_nickname, driver_phone, driver_line, driver_whatsapp,
    languages, rating, review_count, is_verified, images, zone_rates, rate_note, location, region,
    popular_routes, amenities, description, plate_type, plate_number, can_issue_tax_invoice, business_type, is_available,
    rental_type, transmission
) values (
    'v-sd-bkk01',
    'Toyota Corolla Altis 1.8 Hybrid 5 ที่นั่ง (สยาม คาร์ ลิสซิ่ง สุวรรณภูมิ/ดอนเมือง)',
    'car',
    5,
    'บริษัท สยาม คาร์ ลิสซิ่ง แอนด์ ทราเวล จำกัด',
    'สยาม ลิสซิ่ง (สุวรรณภูมิ/ดอนเมือง)',
    '085-888-3456',
    'https://line.me',
    'https://wa.me/66858883456',
    array['th', 'en', 'zh'],
    4.9,
    82,
    true,
    array['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    '{"city": 1150, "midHill": 1150, "highHill": 1150, "crossProvince": 1150}'::jsonb,
    'ออกใบกำกับภาษีเต็มรูป + หัก ณ ที่จ่าย 3% ได้ สะดวกสำหรับนิติบุคคล',
    'กรุงเทพฯ / สนามบินสุวรรณภูมิ (BKK) / ดอนเมือง (DMK)',
    'central',
    array['สนามบินสุวรรณภูมิ', 'สนามบินดอนเมือง', 'พัทยา', 'หัวหิน', 'อยุธยา'],
    array[
        'ซีดานไฮบริด นุ่มนวล เงียบ ประหยัดน้ำมัน',
        'รองรับจุดรับ-ส่งทั้งสนามบินสุวรรณภูมิและดอนเมือง',
        'ออกใบเสร็จรับเงิน/ใบกำกับภาษีเต็มรูปแบบได้',
        'มีบริการรูดล็อควงเงินบัตรเครดิตสำหรับเงินประกัน',
        'เปิดให้บริการและนัดหมายรับรถได้ตลอด 24 ชม.'
    ],
    'รถเก๋งซีดานขนาดกลางยอดนิยมอันดับหนึ่ง เหมาะสำหรับทั้งการเดินทางเพื่อธุรกิจและการท่องเที่ยวพักผ่อน ห้องโดยสารกว้างขวาง นั่งสบาย นุ่มนวล เดินทางไกลข้ามจังหวัดไม่เมื่อยล้า',
    'blue',
    '8กฮ-2411 กทม.',
    true,
    'company',
    true,
    'self_drive',
    'auto'
) on conflict (id) do update set
    rental_type = excluded.rental_type,
    transmission = excluded.transmission,
    is_available = excluded.is_available,
    updated_at = now();
