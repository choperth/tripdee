-- 08_sponsor_catalog_seed.sql
--
-- Restores the travel-partner catalogue into public.sponsors.
--
-- The table was empty, so /api/sponsors returned nothing and the admin console
-- sponsor tab showed "0 sponsors" even though the public site rendered the
-- partner list from a hardcoded array in TrustedPartnersSection.tsx.
--
-- IMPORTANT: ids must NOT match mockConfig.isMockSponsorId (/^sp-<1..22>$/),
-- because fetchSponsors strips those ids in production. The previous seed in
-- schema.sql used sp-7..sp-12, which the filter always removed — so it could
-- never surface. These descriptive ids are kept instead.
--
-- Run once in the Supabase SQL Editor. Idempotent (upsert by id).

insert into public.sponsors (id, title, category, category_label, tagline, badge_text, image, link, discount_text, location)
values
(
    'sp-connect',
    'The Connect Chiang Mai (เดอะ คอนเน็ค เชียงใหม่)',
    'hotel',
    'ที่พักแนะนำพันธมิตร',
    'ห้องพักรายวันและรายเดือนสไตล์โมเดิร์นลอฟท์ เงียบสงบ ใกล้สนามบินเชียงใหม่และเซ็นทรัลแอร์พอร์ต พร้อมคาเฟ่ Coffee Connect และที่จอดรถ',
    'ที่พักใกล้สนามบิน เชียงใหม่',
    '/images/connect.jpg',
    'https://www.facebook.com/Theconnectchiangmai',
    'ห้องพักสะอาด บรรยากาศเป็นกันเอง พร้อมคาเฟ่ในตัวและที่จอดรถสะดวกสบาย',
    'ต.แม่เหียะ อ.เมือง จ.เชียงใหม่ (ใกล้สนามบินนานาชาติเชียงใหม่)'
),
(
    'sp-baan-thip',
    'บ้านทิพย์ - พูลวิลล่าริมน้ำสวยงาม (Baan Thip Villa)',
    'hotel',
    'พูลวิลล่าริมน้ำ',
    'วิลล่าพักผ่อนริมน้ำ 4 ห้องนอน สระว่ายน้ำส่วนตัวและสวนสีเขียวขนาดใหญ่ ออกแบบโดยสถาปนิก เหมาะสำหรับครอบครัวและกลุ่มเพื่อน',
    'พูลวิลล่าริมน้ำ เชียงใหม่',
    '/images/baan-thip-villa.jpg',
    'https://th.airbnb.com/rooms/32648518',
    'วิลล่าทั้งหลัง 4 ห้องนอน 4 เตียง สระว่ายน้ำส่วนตัวริมน้ำปิง',
    'ริมแม่น้ำ อ.เมืองเชียงใหม่ จ.เชียงใหม่'
),
(
    'sp-baan-sri-dha',
    'บ้านศรีธา - บ้านไม้ที่มีเสน่ห์ในเมือง (Baan Sri Dha)',
    'hotel',
    'บ้านพักไม้ทรงเสน่ห์',
    'บ้านกึ่งไม้ทั้งหลัง 5 ห้องนอน รองรับ 9 คน ใกล้ประตูเชียงใหม่และถนนคนเดินวัวลาย พร้อมอาหารเช้าโฮมเมดและบริการรถรับส่งฟรี',
    'ที่พักติดอันดับท็อป 1%',
    '/images/baan-sri-dha.jpg',
    'https://th.airbnb.com/rooms/9056914',
    'บ้านทั้งหลัง 5 ห้องนอน 5 เตียง ฟรีอาหารเช้าและรถรับส่งสนามบิน',
    'ต.หายยา อ.เมืองเชียงใหม่ (ใกล้ประตูเชียงใหม่ & ถนนคนเดินวัวลาย)'
),
(
    'sp-lanna-apartment',
    'อพาร์ทเมนท์ล้านนา - ที่พัก 5 ห้องนอนกว้างขวางกลางเมืองเชียงใหม่ (Lanna Apartment)',
    'hotel',
    'ที่พัก 5 ห้องนอนในเมือง',
    'ชั้น 1 ของอาคารส่วนตัวทั้งชั้น ห้องนอน 5 ห้อง ห้องน้ำในตัวทุกห้อง เครื่องปรับอากาศทุกห้อง ห้องนั่งเล่นล้อมรอบ 3 ห้อง และลานกลางแจ้ง เหมาะกับครอบครัวและกลุ่มเพื่อนที่รองรับได้ถึง 10 คน',
    'ที่พักติดอันดับท็อป 10%',
    '/images/lanna-riverside-home.jpg',
    'https://th.airbnb.com/rooms/957661325183385971',
    'รถรับส่งสนามบินฟรี · อาหารเช้าเสริม · Wi-Fi ใยแก้วนำแสง 287 Mbps · ที่จอดรถฟรี',
    'ต.หายยา อ.เมืองเชียงใหม่ (เดิน 6 นาทีถึงตลาดประตูเชียงใหม่)'
),
(
    'sp-baan-sri-dha-yoga',
    'บ้านศรีธา - บ้านสไตล์ล้านนาและโยคะ (Baan Sri Dha Lanna & Yoga)',
    'hotel',
    'บ้านพักสไตล์ล้านนา & โยคะ',
    'บ้านเดี่ยวไม้สักสไตล์ล้านนา 3 ห้องนอน 3 ห้องน้ำ รองรับ 5 คน พื้นที่สีเขียวและลานโยคะส่วนตัว ใกล้ตลาดประตูเชียงใหม่ พร้อมอาหารเช้าโฮมเมดและบริการรถรับส่งสนามบินฟรี',
    'โดนใจเกสต์',
    '/images/baan-sri-dha-yoga.jpg',
    'https://th.airbnb.com/rooms/17126437',
    'บ้านทั้งหลัง 3 ห้องนอน 3 ห้องน้ำ ฟรีอาหารเช้าปรุงสด + รถรับส่งสนามบิน',
    'ต.หายยา อ.เมืองเชียงใหม่ (เดิน 6-10 นาทีถึงตลาดประตูเชียงใหม่ & ถนนคนเดินวัวลาย)'
),
(
    'sp-rantong',
    'Ran-Tong (Save & Help Elephant Center) ปางช้างเชิงจริยธรรม เชียงใหม่',
    'activity',
    'กิจกรรมท่องเที่ยวเชิงจริยธรรม',
    'สัมผัสความน่ารักของช้างอย่างมีจริยธรรม No Riding ไม่ขี่ ไม่ล่ามโซ่ ป้อนอาหาร ทำสมุนไพรรักษาช้าง และอาบน้ำช้างในลำธารธรรมชาติ อ.แม่แตง',
    'ปางช้างเชิงจริยธรรม แม่แตง',
    '/images/rantong-sanctuary.jpg',
    'https://www.rantongelephantsanctuary.com/',
    'กิจกรรมดูแลช้าง ป้อนอาหาร และอาบน้ำช้างในลำธารธรรมชาติ',
    'บ้านช้าง อ.แม่แตง จ.เชียงใหม่'
),
(
    'sp-vespa',
    'Vespa Adventures Chiang Mai - ทัวร์เวสป้าชมเชียงใหม่',
    'tour',
    'ทัวร์ & กิจกรรมท่องเที่ยว',
    'นั่งเวสป้าคลาสสิกเที่ยวเชียงใหม่ 5 เส้นทาง - City Highlights, After Dark, Foodie (MICHELIN), Countryside และ Sunrise Monk Blessing',
    'ทัวร์เวสป้าสัมผัสเมือง',
    '/images/vespa.jpg',
    'https://vespaadventures.com/destination/thailand',
    'ทัวร์เวสป้าคลาสสิกสัมผัสวิถีชีวิตและวัฒนธรรมเชียงใหม่',
    'เชียงใหม่ / ภาคเหนือ'
),
(
    'sp-sukjai',
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
on conflict (id) do update set
    title = excluded.title,
    category = excluded.category,
    category_label = excluded.category_label,
    tagline = excluded.tagline,
    badge_text = excluded.badge_text,
    image = excluded.image,
    link = excluded.link,
    discount_text = excluded.discount_text,
    location = excluded.location;
