export type ZoneId = 'city' | 'midHill' | 'highHill' | 'crossProvince';

export interface ZoneRateCard {
  id: ZoneId;
  zoneNo: number;
  label: string;
  shortLabel: string;
  examples: string;
  /** ราคากลางมาตรฐานต่อวัน [ต่ำสุด, สูงสุด] */
  baseRateRange: [number, number];
  /** ค่าเหมาน้ำมันประมาณการต่อวัน */
  fuelFlatRatePerDay: number;
}

export interface Vehicle {
  id: string;
  title: string;
  type: 'van' | 'car' | 'suv';
  seats: number;
  driverName: string;
  driverNickname: string;
  driverPhone: string;
  driverLine: string;
  driverWhatsapp?: string;
  driverWechat?: string;
  driverKakao?: string;
  languages?: ('th' | 'en' | 'zh' | 'ko')[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  images: string[];
  /** อัตราค่าเช่าพร้อมคนขับต่อวัน แยกตามโซนปลายทาง */
  zoneRates: Record<ZoneId, number>;
  /** หมายเหตุราคาเฉพาะคัน (ถ้ามี) */
  rateNote?: string;
  location: string;
  region?: 'north' | 'central' | 'south' | 'east' | 'isan';
  popularRoutes: string[];
  amenities: string[];
  description: string;
  /** ประเภทป้ายทะเบียน: yellow = ป้ายเหลือง 30 ขนส่งสาธารณะ, blue = ป้ายฟ้า ส่วนบุคคล */
  plateType?: 'yellow' | 'blue';
  /** เลขทะเบียนรถ */
  plateNumber?: string;
  /** สามารถออกใบกำกับภาษี / ใบเสร็จรับเงินเต็มรูปแบบ / หัก ณ ที่จ่าย 3% ได้ */
  canIssueTaxInvoice?: boolean;
  /** รูปแบบผู้ให้บริการ: company = บริษัท/นิติบุคคล, individual = คนขับอิสระ/ส่วนบุคคล */
  businessType?: 'company' | 'individual';
  /** สถานะความพร้อม: true = ว่างพร้อมรับงาน, false = คิวเต็มชั่วคราว */
  isAvailable?: boolean;
}

export interface Sponsor {
  id: string;
  title: string;
  category: 'hotel' | 'auto_service' | 'restaurant' | 'activity' | 'insurance' | 'fuel';
  categoryLabel: string;
  tagline: string;
  badgeText: string;
  image: string;
  link: string;
  discountText: string;
  location: string;
  region?: 'north' | 'central' | 'south' | 'northeast' | 'all';
  targetAudience?: 'traveler' | 'driver' | 'all';
  logo?: string;
}

export interface TravelRoute {
  id: string;
  name: string;
  zone: string;
  highlight: string;
  image: string;
  estimatedPrice: string;
  recommendedVehicle: string;
  /** Thai match key for vehicle filtering; stable across display languages */
  filterKey: string;
}

export const ZONE_RATE_CARDS: ZoneRateCard[] = [
  {
    id: 'city',
    zoneNo: 1,
    label: 'ในเมือง / ตัวจังหวัด / สนามบิน',
    shortLabel: 'ในเมือง',
    examples: 'กทม.และปริมณฑล, ตัวเมืองเชียงใหม่, ตัวเมืองภูเก็ต, พัทยา',
    baseRateRange: [1800, 2000],
    fuelFlatRatePerDay: 500,
  },
  {
    id: 'midHill',
    zoneNo: 2,
    label: 'ชานเมือง / แหล่งท่องเที่ยวเนินเขา / ชายหาด',
    shortLabel: 'ชานเมือง/ชายหาด',
    examples: 'เขาใหญ่, ม่อนแจ่ม, หัวหิน, ชะอำ, พังงา, บางแสน',
    baseRateRange: [2000, 2200],
    fuelFlatRatePerDay: 700,
  },
  {
    id: 'highHill',
    zoneNo: 3,
    label: 'ภูเขาสูงชัน / ทางไกล / ทะเลเกาะ',
    shortLabel: 'ภูเขาสูง/เกาะ',
    examples: 'ดอยอินทนนท์, ภูทับเบิก, ปาย, กุยบุรี, ท่าเรือเกาะช้าง',
    baseRateRange: [2200, 2500],
    fuelFlatRatePerDay: 900,
  },
  {
    id: 'crossProvince',
    zoneNo: 4,
    label: 'ข้ามจังหวัด / ทริปเหมาทางไกล',
    shortLabel: 'ข้ามจังหวัด',
    examples: 'กทม.-พัทยา/หัวหิน, เชียงใหม่-เชียงราย, ภูเก็ต-กระบี่',
    baseRateRange: [2500, 3000],
    fuelFlatRatePerDay: 1200,
  },
];

export const STANDARD_TERMS = {
  workHoursPerDay: 10,
  workStart: '08:00',
  workEnd: '18:00',
  overtimeRatePerHour: 200,
  overnightStayRate: 500,
  fuelNote: 'ลูกค้าเลือกได้: เติมน้ำมันคืนเต็มถังตามจริง หรือเหมาค่าน้ำมันตามโซน',
};

export const formatTHB = (n: number): string => `฿${n.toLocaleString('th-TH')}`;

export const POPULAR_ROUTES: TravelRoute[] = [
  {
    id: 'mon-jam',
    name: 'ม่อนแจ่ม - แม่ริม (เชียงใหม่)',
    filterKey: 'ม่อนแจ่ม',
    zone: 'ภาคเหนือ / ธรรมชาติ',
    highlight: 'ทุ่งดอกไม้ สวนส้ม ทะเลหมอก คาเฟ่วิวเขา',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '1,800 - 2,200 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP / SUV'
  },
  {
    id: 'bkk-pattaya',
    name: 'กรุงเทพฯ - พัทยา - สัตหีบ',
    filterKey: 'พัทยา',
    zone: 'ภาคตะวันออก / ทะเล',
    highlight: 'แหลมบาลีฮาย สวนนงนุช เกาะล้าน ท่องเที่ยวชายทะเล',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,000 - 2,500 บ./วัน',
    recommendedVehicle: 'Toyota Majesty / VIP Van'
  },
  {
    id: 'inthanon',
    name: 'ดอยอินทนนท์ - กิ่วแม่ปาน (เชียงใหม่)',
    filterKey: 'ดอยอินทนนท์',
    zone: 'ภาคเหนือ / ดอยสูง',
    highlight: 'จุดสูงสุดแดนสยาม พระมหาธาตุฯ น้ำตกวชิรธาร เส้นทางศึกษาธรรมชาติ',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,200 - 2,500 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP เครื่องแรงชำนาญทาง'
  },
  {
    id: 'phuket-phangnga',
    name: 'ภูเก็ต - พังงา - เสม็ดนางชี',
    filterKey: 'ภูเก็ต',
    zone: 'ภาคใต้ / ทะเลอันดามัน',
    highlight: 'จุดชมวิวอ่าวพังงา หาดป่าตอง เมืองเก่าภูเก็ต แหลมพรหมเทพ',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,200 - 2,600 บ./วัน',
    recommendedVehicle: 'All New Commuter VIP'
  },
  {
    id: 'khao-yai',
    name: 'กรุงเทพฯ - เขาใหญ่ - ปากช่อง',
    filterKey: 'เขาใหญ่',
    zone: 'ภาคอีสาน / อากาศบริสุทธิ์',
    highlight: 'อุทยานแห่งชาติเขาใหญ่ ไร่องุ่น คาเฟ่ธรรมชาติ สัมมนากลุ่ม',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,000 - 2,400 บ./วัน',
    recommendedVehicle: 'Toyota Commuter / SUV 4WD'
  },
  {
    id: 'bkk-huahin',
    name: 'กรุงเทพฯ - ชะอำ - หัวหิน',
    filterKey: 'หัวหิน',
    zone: 'ภาคกลาง / พักผ่อนตากอากาศ',
    highlight: 'ชายหาดหัวหิน ตลาดซิเคด้า พระราชนิเวศน์มฤคทายวัน',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,200 - 2,600 บ./วัน',
    recommendedVehicle: 'Toyota Majesty / VIP Van'
  }
];

export const SPONSORS: Sponsor[] = [
  {
    id: 'sp-1',
    title: 'หมอกฟ้า พูลวิลล่า & แกลมปิ้ง ม่อนแจ่ม',
    category: 'hotel',
    categoryLabel: 'ที่พักแนะนำพันธมิตร',
    tagline: 'สัมผัสทะเลหมอกหน้าห้องพัก สระว่ายน้ำส่วนตัว พร้อมชุดหมูกระทะยามเย็น',
    badgeText: 'ส่วนลดพิเศษลูกค้า TripDee',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    link: 'https://line.me',
    discountText: 'ลดทันที 15% เมื่อแสดงใบจองหรือบอกว่ามาจาก TripDee',
    location: 'ม่อนแจ่ม, เชียงใหม่',
    region: 'north',
    targetAudience: 'traveler',
  },
  {
    id: 'sp-2',
    title: 'ซีเอ็นเอ็กซ์ เซอร์วิสแอนด์ไทร์ (ศูนย์ยางและเบรกรถตู้)',
    category: 'auto_service',
    categoryLabel: 'บริการสำหรับคนขับ',
    tagline: 'บริการตรวจเช็กระบบเบรก ถ่ายน้ำมันเครื่อง เปลี่ยนยางราคาพิเศษสำหรับสมาชิก TripDee',
    badgeText: 'สิทธิพิเศษคนขับ TripDee',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    link: 'tel:0899999999',
    discountText: 'เปลี่ยนยาง 4 เส้น ฟรีสลับยาง-ถ่วงล้อตลอดอายุการใช้งาน',
    location: 'ถนนซุปเปอร์ไฮเวย์ เชียงใหม่',
    region: 'north',
    targetAudience: 'driver',
  },
  {
    id: 'sp-3',
    title: 'ทิพยประกันภัย คุ้มครองอุบัติเหตุ & ค่าเสียหายส่วนแรก',
    category: 'insurance',
    categoryLabel: 'ประกันภัยการเดินทาง & รถเช่า',
    tagline: 'เดินทางอุ่นใจไร้กังวล คุ้มครองทั้งคนขับ ผู้โดยสาร และความเสียหายตัวรถตลอด 24 ชม.',
    badgeText: 'สิทธิพิเศษสำหรับผู้เดินทาง',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    link: 'https://www.dhipaya.co.th',
    discountText: 'เบี้ยประกันเริ่มต้นเพียง 50 บาท/วัน เคลมไวง่ายผ่านแอป',
    location: 'คุ้มครองทั่วประเทศไทย',
    region: 'all',
    targetAudience: 'all',
  },
  {
    id: 'sp-4',
    title: 'PT Max Card Plus สิทธิพิเศษน้ำมัน & กาแฟพันธุ์ไทย',
    category: 'fuel',
    categoryLabel: 'ส่วนลดพลังงานและการเดินทาง',
    tagline: 'บัตรเดียวคุ้ม เติมน้ำมันลดลิตรละ 50 สต. พร้อมรับส่วนลดเครื่องดื่ม 50% ทุกสาขาทั่วไทย',
    badgeText: 'พันธมิตรการเดินทาง',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    link: 'https://www.pt.co.th',
    discountText: 'สมัครผ่าน TripDee รับแต้มสะสมฟรี 500 พอยท์ทันที',
    location: 'สถานีบริการน้ำมัน PT ทั่วประเทศ',
    region: 'all',
    targetAudience: 'all',
  },
];

export interface OfficialPartner {
  id: string;
  name: string;
  category: string;
  badge: string;
  logoIcon: string;
  highlight: string;
  link: string;
}

export const OFFICIAL_PARTNERS: OfficialPartner[] = [
  {
    id: 'p-ptt',
    name: 'PTT Station & EV Station',
    category: 'สถานีบริการน้ำมัน & จุดชาร์จ EV',
    badge: 'พลังงานการเดินทาง',
    logoIcon: '⛽',
    highlight: 'สะสมแต้ม Blue Card & จุดพักรถมาตรฐาน',
    link: 'https://www.pttor.com',
  },
  {
    id: 'p-pt',
    name: 'PT Max Card Plus',
    category: 'น้ำมันและเครื่องดื่ม',
    badge: 'ส่วนลดคนขับ & นักเดินทาง',
    logoIcon: '☕',
    highlight: 'ลดลิตรละ 50 สต. + พันธุ์ไทย 50%',
    link: 'https://www.pt.co.th',
  },
  {
    id: 'p-msig',
    name: 'MSIG Insurance',
    category: 'ประกันภัยการเดินทาง',
    badge: 'คุ้มครองทริป',
    logoIcon: '🛡️',
    highlight: 'ประกันเดินทาง & รถเช่า เริ่มต้น 50 บ./วัน',
    link: 'https://www.msig-thai.com',
  },
  {
    id: 'p-dhipaya',
    name: 'ทิพยประกันภัย',
    category: 'ประกันภัยยานพาหนะ',
    badge: 'ประกันภัยชั้นนำ',
    logoIcon: '🏢',
    highlight: 'พ.ร.บ. และประกันภัยชั้น 1 คุ้มครองผู้โดยสาร',
    link: 'https://www.dhipaya.co.th',
  },
  {
    id: 'p-bquik',
    name: 'B-Quik (บี-ควิก)',
    category: 'ศูนย์บริการยางและเบรก',
    badge: 'ดูแลรถตู้ & รถเช่า',
    logoIcon: '🔧',
    highlight: 'ตรวจเช็กสุขภาพรถฟรี 30 รายการก่อนออกทริป',
    link: 'https://www.b-quik.com',
  },
  {
    id: 'p-cockpit',
    name: 'COCKPIT (ค็อกพิท)',
    category: 'ยางบริดจสโตนมาตรฐาน',
    badge: 'มาตรฐานความปลอดภัย',
    logoIcon: '🛞',
    highlight: 'เปลี่ยนยางรับประกัน 1 ปี พร้อมบริการฉุกเฉิน 24 ชม.',
    link: 'https://www.cockpit.co.th',
  },
  {
    id: 'p-veranda',
    name: 'Veranda Resort & Hotels',
    category: 'เครือโรงแรมและรีสอร์ต',
    badge: 'ที่พักพันธมิตร VIP',
    logoIcon: '🏨',
    highlight: 'ส่วนลดห้องพัก 15% เชียงใหม่ พัทยา หัวหิน',
    link: 'https://www.verandaresort.com',
  },
  {
    id: 'p-mhokfah',
    name: 'หมอกฟ้า พูลวิลล่า ม่อนแจ่ม',
    category: 'ที่พักวิวดอย & แกลมปิ้ง',
    badge: 'ท็อปเรตติ้งภาคเหนือ',
    logoIcon: '🌄',
    highlight: 'พูลวิลล่าส่วนตัวพร้อมหมูกระทะยามเย็น ลด 15%',
    link: 'https://line.me',
  },
];

export function getContextualSponsor(params: {
  region?: string;
  isSelfDrive?: boolean;
  audience?: 'traveler' | 'driver';
}): Sponsor {
  if (params.audience === 'driver') {
    return SPONSORS.find((s) => s.category === 'auto_service') || SPONSORS[1];
  }
  if (params.isSelfDrive) {
    return SPONSORS.find((s) => s.category === 'insurance') || SPONSORS[2];
  }
  if (params.region === 'north') {
    return SPONSORS.find((s) => s.region === 'north' && s.targetAudience === 'traveler') || SPONSORS[0];
  }
  return SPONSORS[0];
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'v-1',
    title: 'Toyota Commuter VIP 9 ที่นั่ง เบาะนวดไฟฟ้า คาราโอเกะจัดเต็ม',
    type: 'van',
    seats: 9,
    driverName: 'นายสุรชัย ใจดี',
    driverNickname: 'พี่ชัย รถตู้เชียงใหม่',
    driverPhone: '081-234-5678',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66812345678',
    driverWechat: 'chaicnx_van',
    driverKakao: 'chaivan_cnx',
    languages: ['th', 'en'],
    region: 'north',
    rating: 4.9,
    reviewCount: 48,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
    location: 'เชียงใหม่ / ม่อนแจ่ม / ดอยอินทนนท์ / ภาคเหนือ',
    popularRoutes: ['ม่อนแจ่ม', 'ดอยอินทนนท์', 'แม่กำปอง', 'เชียงใหม่', 'เชียงราย'],
    amenities: [
      'เบาะนวดปรับไฟฟ้า 9 ที่นั่ง',
      'ชุดคาราโอเกะ + YouTube Smart TV',
      'WiFi ความเร็วสูงบนรถ',
      'ที่ชาร์จ Type-C / USB ทุกที่นั่ง',
      'ประกันภัยผู้โดยสารชั้น 1',
      'ตู้เย็นขนาดเล็กบนรถ'
    ],
    description: 'รถตู้ตกแต่ง VIP สภาพใหม่เอี่ยม แอร์เย็นฉ่ำ เบาะนวดสบาย เหมาะสำหรับทริปครอบครัว ผู้บริหาร และกลุ่มเพื่อน คนขับชำนาญเส้นทางดอยสูง ปลอดภัย สื่อสารภาษาอังกฤษพื้นฐานได้ ไม่สูบบุหรี่',
    plateType: 'yellow',
    plateNumber: '30-4521 ชม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-2',
    title: 'Toyota Majesty Executive 7 ที่นั่ง เบาะ Captain Seat พรีเมียม (กทม. & พัทยา & หัวหิน)',
    type: 'van',
    seats: 7,
    driverName: 'นายวรพจน์ กานต์ธนา',
    driverNickname: 'พี่พจน์ VIP Limo',
    driverPhone: '086-555-1234',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66865551234',
    driverWechat: 'bkk_limo_vip',
    languages: ['th', 'en', 'zh'],
    region: 'central',
    rating: 5.0,
    reviewCount: 42,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 3200, midHill: 3400, highHill: 3600, crossProvince: 4000 },
    rateNote: 'รุ่นพรีเมียมผู้บริหาร ออกใบกำกับภาษีเต็มรูปได้',
    location: 'กรุงเทพฯ & ปริมณฑล / พัทยา / หัวหิน / อยุธยา',
    popularRoutes: ['กรุงเทพฯ', 'พัทยา', 'หัวหิน', 'อยุธยา', 'สนามบินสุวรรณภูมิ'],
    amenities: [
      'เบาะ Captain Seat ปรับไฟฟ้าคู่หน้า',
      'ประตูสไลด์ไฟฟ้าสองฝั่ง',
      'ระบบฟอกอากาศ Nanoe',
      'คนขับสื่อสารภาษาอังกฤษและจีนได้',
      'รองรับการออกใบกำกับภาษีเต็มรูปแบบ'
    ],
    description: 'ระดับพรีเมียมสำหรับรับรองแขก VIP ลูกค้าองค์กร ชาวต่างชาติ หรือทริปครอบครัวที่ต้องการความหรูหราและความเป็นส่วนตัวสูงสุด ออกใบกำกับภาษีในนามบริษัทได้',
    plateType: 'yellow',
    plateNumber: '30-1122 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-3',
    title: 'All New Commuter VIP 10 ที่นั่ง หลังคาสูง (ภูเก็ต & พังงา & กระบี่)',
    type: 'van',
    seats: 10,
    driverName: 'นายเอกชัย อันดามัน',
    driverNickname: 'โกเอก รถตู้ภูเก็ต VIP',
    driverPhone: '089-876-5432',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66898765432',
    driverWechat: 'phuket_andaman_van',
    driverKakao: 'phuketvan88',
    languages: ['th', 'en'],
    region: 'south',
    rating: 4.9,
    reviewCount: 56,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 2000, midHill: 2200, highHill: 2500, crossProvince: 2800 },
    location: 'ภูเก็ต / กระบี่ / พังงา / เขาหลัก',
    popularRoutes: ['ภูเก็ต', 'พังงา', 'กระบี่', 'สนามบินภูเก็ต'],
    amenities: [
      'เบาะ VIP 10 ที่นั่ง กว้างขวาง',
      'จอเพดาน Android TV + คาราโอเกะ',
      'ช่องชาร์จโทรศัพท์ทุกที่นั่ง',
      'ประกันภัยผู้โดยสารชั้น 1',
      'คนขับชำนาญเส้นทางแหล่งท่องเที่ยวอันดามัน'
    ],
    description: 'รถตู้ VIP สภาพใหม่เอี่ยม เบาะหนังแท้นุ่มสบาย ระบบแอร์เย็นฉ่ำทั่วคัน เหมาะสำหรับรับส่งสนามบินภูเก็ต ทริปเที่ยวอ่าวพังงา เกาะพีพี หรือข้ามไปกระบี่และเขาหลัก',
    plateType: 'blue',
    plateNumber: 'นข-7788 ภก.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-4',
    title: 'Hyundai Staria VIP 9 ที่นั่ง โมเดิร์นลักชัวรี่ (พัทยา & ชลบุรี & ระยอง)',
    type: 'van',
    seats: 9,
    driverName: 'นายยุทธนา ชลประทาน',
    driverNickname: 'พี่ยุทธ พัทยาทราเวล',
    driverPhone: '082-333-4455',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66823334455',
    driverKakao: 'pattaya_staria',
    languages: ['th', 'en', 'ko'],
    region: 'east',
    rating: 4.9,
    reviewCount: 38,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 2400, midHill: 2600, highHill: 2900, crossProvince: 3300 },
    location: 'พัทยา / ชลบุรี / สัตหีบ / ระยอง / เกาะช้าง',
    popularRoutes: ['พัทยา', 'สัตหีบ', 'ระยอง', 'เกาะช้าง', 'สนามบินอู่ตะเภา'],
    amenities: [
      'ห้องโดยสารสไตล์ยานอวกาศ หน้าต่างกว้างพาโนรามา',
      'เบาะนวด Relaxing Seat ปรับเอนไฟฟ้า',
      'คนขับสื่อสารภาษาอังกฤษและเกาหลีได้',
      'กล้อง 360 องศา ระบบความปลอดภัยครบ',
      'ออกใบเสร็จรับเงิน/ใบกำกับภาษีได้'
    ],
    description: 'รถตู้ดีไซน์ล้ำสมัยระดับพรีเมียม ขับนุ่มนวล เงียบสงบ เหมาะสำหรับนักธุรกิจ ทริปตีกอล์ฟ และครอบครัวที่มาพักผ่อนพัทยาและระยอง คนขับสุภาพ ตรงต่อเวลา',
    plateType: 'yellow',
    plateNumber: '30-3344 ชบ.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-5',
    title: 'Toyota Fortuner 4WD 7 ที่นั่ง ลุยธรรมชาติ (เขาใหญ่ & โคราช & อีสาน)',
    type: 'suv',
    seats: 7,
    driverName: 'นายโชคชัย สุวรรณภูมิ',
    driverNickname: 'พี่โชค เขาใหญ่ทัวร์',
    driverPhone: '085-111-2233',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66851112233',
    languages: ['th', 'en'],
    region: 'isan',
    rating: 4.8,
    reviewCount: 45,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1800, midHill: 2000, highHill: 2200, crossProvince: 2600 },
    location: 'เขาใหญ่ / ปากช่อง / นครราชสีมา / ขอนแก่น',
    popularRoutes: ['เขาใหญ่', 'ปากช่อง', 'วังน้ำเขียว', 'ขอนแก่น'],
    amenities: [
      'ระบบขับเคลื่อน 4 ล้อ ลุยเส้นทางธรรมชาติสบาย',
      'Apple CarPlay / Android Auto',
      'ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร',
      'พร้อมคนขับชำนาญทางเขาใหญ่-วังน้ำเขียว',
      'บริการส่งรับรถถึงที่พัก'
    ],
    description: 'รถ SUV สภาพดีเยี่ยม เหมาะสำหรับกลุ่มเล็ก 4-6 คน เที่ยวสูดอากาศบริสุทธิ์เขาใหญ่ วังน้ำเขียว หรือทริปธุรกิจขอนแก่น คนขับใจดี ชำนาญจุดถ่ายรูปและร้านอาหารอร่อย',
    plateType: 'blue',
    plateNumber: 'กข-9921 นม.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-6',
    title: 'Toyota Coaster มินิบัส VIP 20 ที่นั่ง สำหรับกรุ๊ปสัมมนา & ดูงาน (กทม.-พัทยา-เขาใหญ่)',
    type: 'van',
    seats: 20,
    driverName: 'นายอนุชิต สัมมนาทัวร์',
    driverNickname: 'ทีมงาน มินิบัส Coaster กทม.',
    driverPhone: '088-776-5544',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66887765544',
    languages: ['th', 'en'],
    region: 'central',
    rating: 4.9,
    reviewCount: 31,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 3500, midHill: 3800, highHill: 4200, crossProvince: 4500 },
    rateNote: 'ป้ายเหลือง 30 ออกใบกำกับภาษีเต็มรูป + หัก ณ ที่จ่าย 3% สะดวกสำหรับนิติบุคคล',
    location: 'กรุงเทพฯ / ปริมณฑล / พัทยา / เขาใหญ่ / อยุธยา',
    popularRoutes: ['กรุงเทพฯ', 'พัทยา', 'เขาใหญ่', 'อยุธยา', 'สนามบินสุวรรณภูมิ'],
    amenities: [
      'มินิบัส VIP 20 ที่นั่ง เบาะหนานุ่มพร้อมเข็มขัดนิรภัย',
      'ระบบไมโครโฟนนำเที่ยว & ระบบเสียงบรรยาย',
      'Smart TV คาราโอเกะ + YouTube',
      'GPS ติดตามรถกรมการขนส่งทางบก 100%',
      'ออกใบกำกับภาษีและใบเสร็จในนามนิติบุคคลได้'
    ],
    description: 'รถมินิบัส Toyota Coaster 20 ที่นั่ง สภาพใหม่กริ๊บ ตกแต่ง VIP นั่งสบาย ไม่อึดอัด เหมาะมากสำหรับทริปสัมมนาบริษัท ทัศนศึกษา ดูงาน หรือครอบครัวใหญ่ ป้ายเหลือง 30 ถูกต้องตามกฎหมาย มีประกันภัยชั้น 1 สูงสุด',
    plateType: 'yellow',
    plateNumber: '30-8899 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-7',
    title: 'Toyota Alphard First Class 5 ที่นั่ง Super VIP เบาะ Ottoman ปรับนอน (กทม. & สนามบิน)',
    type: 'van',
    seats: 5,
    driverName: 'นายกิตติศักดิ์ ลิมูซีน',
    driverNickname: 'คุณกิต Alphard First Class',
    driverPhone: '081-999-8877',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66819998877',
    driverWechat: 'alphard_bkk_vip',
    languages: ['th', 'en', 'zh'],
    region: 'central',
    rating: 5.0,
    reviewCount: 64,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 4500, midHill: 4800, highHill: 5200, crossProvince: 5800 },
    rateNote: 'บริการระดับ First Class แต่งกายสูทสากล พร้อมน้ำแร่ต้อนรับ',
    location: 'กรุงเทพฯ / สนามบินสุวรรณภูมิ / ดอนเมือง / พัทยา / หัวหิน',
    popularRoutes: ['กรุงเทพฯ', 'สนามบินสุวรรณภูมิ', 'พัทยา', 'หัวหิน'],
    amenities: [
      'เบาะ Ottoman First Class ปรับนอนไฟฟ้าพร้อมนวด',
      'หลังคา Twin Moonroof รับแสงธรรมชาติ',
      'จอเพดาน 13.3 นิ้ว + เครื่องเสียงระดับพรีเมียม',
      'คนขับแต่งกายสูทสากล สุภาพ ผ่านการอบรม VVIP',
      'บริการน้ำดื่มแร่ ผ้าเย็น และร่มกันแดดบนรถ'
    ],
    description: 'ที่สุดแห่งความสะดวกสบายระดับ VVIP เหมาะสำหรับการรับรองแขกระดับผู้บริหารระดับสูง แขกวีไอพีต่างประเทศ งานประชุมสัมมนาระดับชาติ งานแต่งงาน หรือวันพิเศษของครอบครัว ออกใบกำกับภาษีได้',
    plateType: 'yellow',
    plateNumber: '30-5566 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-8',
    title: 'MG Maxus 9 Luxury EV ไฟฟ้า 100% 7 ที่นั่ง รักษ์โลก เงียบสงบระดับพรีเมียม',
    type: 'van',
    seats: 7,
    driverName: 'นายธนภัทร กรีนโมบิลิตี้',
    driverNickname: 'ภัทร Maxus 9 EV',
    driverPhone: '084-332-1100',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66843321100',
    languages: ['th', 'en'],
    region: 'central',
    rating: 4.9,
    reviewCount: 22,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 3500, midHill: 3800, highHill: 4200, crossProvince: 4600 },
    rateNote: 'EV 100% ตอบโจทย์นโยบาย ESG องค์กร ไม่มีมลพิษ',
    location: 'กรุงเทพฯ / ปริมณฑล / พัทยา / หัวหิน / เขาใหญ่',
    popularRoutes: ['กรุงเทพฯ', 'พัทยา', 'หัวหิน', 'เขาใหญ่'],
    amenities: [
      'พลังงานไฟฟ้า 100% เงียบสนิท ไร้กลิ่นไอเสีย',
      'เบาะ Captain Seats ปรับไฟฟ้า 8 ทิศทางพร้อมนวด',
      'หลังคา Panoramic Sunroof กว้างเต็มบาน',
      'รองรับชาร์จ DC Fast Charging วิ่งได้ไกล 540 กม.',
      'รองรับนโยบายความยั่งยืน ESG สำหรับบริษัทเอกชน'
    ],
    description: 'รถยนต์ MPV ไฟฟ้า 100% สไตล์ลักชัวรี่ ห้องโดยสารกว้างขวาง นุ่มนวล เงียบสนิท ไร้แรงสั่นสะเทือน ตอบสนองนโยบาย Net Zero และ ESG ขององค์กรชั้นนำ หรือทริปครอบครัวที่รักสุขภาพและสิ่งแวดล้อม',
    plateType: 'yellow',
    plateNumber: '30-7711 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-9',
    title: 'Toyota Camry 2.5 Premium Luxury ซีดานผู้บริหาร 4 ที่นั่ง (เชียงใหม่ & ภาคเหนือ)',
    type: 'car',
    seats: 4,
    driverName: 'นายพงษ์พันธ์ จันทร์กระจ่าง',
    driverNickname: 'พี่พงษ์ Camry VIP เชียงใหม่',
    driverPhone: '083-445-6789',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66834456789',
    languages: ['th', 'en'],
    region: 'north',
    rating: 4.9,
    reviewCount: 39,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1600, midHill: 1800, highHill: 2000, crossProvince: 2400 },
    location: 'เชียงใหม่ / นิมมาน / ลำพูน / ลำปาง / เชียงราย',
    popularRoutes: ['เชียงใหม่', 'ม่อนแจ่ม', 'แม่กำปอง', 'เชียงราย'],
    amenities: [
      'เบาะหลังปรับเอนไฟฟ้าพร้อมแผงควบคุมดิจิทัล',
      'ระบบปรับอากาศ Nanoe แยก 3 โซนอิสระ',
      'ม่านบังแดดไฟฟ้าด้านหลังและกระจกข้าง',
      'คนขับชำนาญทางเชียงใหม่-ลำพูน นุ่มนวล ปลอดภัย',
      'ออกใบเสร็จรับเงินสำหรับเบิกบริษัทได้'
    ],
    description: 'รถเก๋งซีดานหรูพร้อมคนขับ เหมาะสำหรับการรับส่งสนามบินเชียงใหม่ เดินทางเจรจาธุรกิจ ติดต่อราชการ หรือคู่รักท่องเที่ยวเชียงใหม่ นั่งสบาย นุ่มนวล เป็นส่วนตัวสูง',
    plateType: 'blue',
    plateNumber: 'กข-3388 ชม.',
    canIssueTaxInvoice: true,
    businessType: 'individual',
    isAvailable: true,
  }
];

export type BoardPostType = 'request' | 'offer';

export interface BoardPost {
  id: string;
  /** request = ลูกค้าตั้งงบหารถ, offer = คนขับตั้งราคาประกาศว่าง */
  type: BoardPostType;
  title: string;
  zoneId: ZoneId;
  date: string;
  days: number;
  seats: number;
  /** ราคาเดียวจบต่อประกาศ (request = งบที่ตั้ง, offer = ราคาเหมา) ไม่มีการประมูล */
  price: number;
  priceNote?: string;
  authorName: string;
  authorPhone: string;
  authorLine: string;
  vehicleLabel?: string;
  detail: string;
  postedAt: string;
  isVerified?: boolean;
  /** หมวดหมู่: general = ทั่วไป/หาเพื่อนเที่ยว, corporate = งานองค์กร/คาราวาน */
  category?: 'general' | 'corporate';
  /** รหัส PIN 4 หลัก สำหรับให้เจ้าของโพสต์กดยกเลิก/ปิดรับงานเอง */
  pin?: string;
  /** สถานะปิดประกาศ: true = ได้รถแล้ว/ปิดรับงานแล้ว */
  isClosed?: boolean;
  /** วันที่สร้าง ISO string สำหรับใช้คำนวณ Auto-expire */
  createdAt?: string;
}

export const BOARD_POSTS: BoardPost[] = [
  {
    id: 'b-1',
    type: 'request',
    title: 'หารถตู้ 9 ที่นั่ง ไปม่อนแจ่ม-แม่ริม 2 วัน 1 คืน',
    zoneId: 'midHill',
    date: '20-21 ก.ย. 69',
    days: 2,
    seats: 8,
    price: 4500,
    priceNote: 'งบรวมน้ำมัน',
    authorName: 'คุณนิดา (ครอบครัว 8 คน)',
    authorPhone: '082-111-2233',
    authorLine: 'https://line.me',
    detail: 'รับที่สนามบินเชียงใหม่เช้าวันแรก เที่ยวม่อนแจ่ม สวนส้ม แม่ริม ค้างม่อนแจ่ม 1 คืน ขอรถมีคาราโอเกะให้เด็กๆ',
    postedAt: '15 นาทีที่แล้ว',
  },
  {
    id: 'b-2',
    type: 'offer',
    title: 'ว่าง! รถตู้ VIP 10 ที่นั่ง รับทริปดอยอินทนนท์วันเดย์',
    zoneId: 'highHill',
    date: '22 ก.ย. 69',
    days: 1,
    seats: 10,
    price: 2300,
    priceNote: 'ไม่รวมน้ำมัน',
    authorName: 'พี่เอก เชียงใหม่ทราเวล',
    authorPhone: '089-876-5432',
    authorLine: 'https://line.me',
    vehicleLabel: 'All New Commuter 10 ที่นั่ง',
    detail: 'ว่างวันจันทน์ที่ 22 รับได้ 1 ทริป เส้นทางกิ่วแม่ปาน พระมหาธาตุฯ น้ำตกวชิรธาร ชำนาญทางดอย ออกเช้า 07:30 กลับถึงเมือง 18:00',
    postedAt: '1 ชม. ที่แล้ว',
    isVerified: true,
  },
  {
    id: 'b-3',
    type: 'request',
    title: 'หารถรับ-ส่งสนามบิน + เที่ยวในเมือง 1 วัน งบ 2,000',
    zoneId: 'city',
    date: '25 ก.ย. 69',
    days: 1,
    seats: 5,
    price: 2000,
    priceNote: 'งบรวมทุกอย่าง',
    authorName: 'คุณมาร์ค (นักท่องเที่ยว 5 คน)',
    authorPhone: '083-444-5566',
    authorLine: 'https://line.me',
    detail: 'ไฟลต์ถึง 09:00 เที่ยววัดพระธาตุดอยสุเทพ นิมมาน คลองแม่ข่า ส่งโรงแรมในเมืองตอนเย็น กระเป๋าใบใหญ่ 5 ใบ',
    postedAt: '3 ชม. ที่แล้ว',
  },
  {
    id: 'b-4',
    type: 'offer',
    title: 'ว่าง! Fortuner 4WD พร้อมคนขับ ทริปเชียงรายวันเดย์',
    zoneId: 'crossProvince',
    date: '27 ก.ย. 69',
    days: 1,
    seats: 4,
    price: 2800,
    priceNote: 'รวมน้ำมันแล้ว',
    authorName: 'พี่ชัย รถตู้เชียงใหม่',
    authorPhone: '081-234-5678',
    authorLine: 'https://line.me',
    vehicleLabel: 'Toyota Fortuner 4WD 7 ที่นั่ง',
    detail: 'วัดร่องขุ่น วัดร่องเสือเต้น ไร่ชาฉุยฟง ออก 07:00 กลับถึงเชียงใหม่ไม่เกิน 20:00 นั่งสบายไม่เกิน 4 ท่าน',
    postedAt: 'เมื่อวาน',
    isVerified: true,
  },
  {
    id: 'b-5',
    type: 'request',
    title: 'หารถตู้ 2 คัน รับคณะดูงานแม่กำปอง ไป-กลับวันเดียว',
    zoneId: 'midHill',
    date: '30 ก.ย. 69',
    days: 1,
    seats: 18,
    price: 4400,
    priceNote: 'งบต่อ 2 คัน ไม่รวมน้ำมัน',
    authorName: 'อบต. สันทราย (คณะ 18 ท่าน)',
    authorPhone: '053-777-888',
    authorLine: 'https://line.me',
    detail: 'คณะศึกษาดูงานหมู่บ้านแม่กำปอง ต้องการรถตู้ 2 คันรุ่นใกล้เคียงกัน ขอใบเสร็จรับเงินเพื่อเบิกงบได้',
    postedAt: 'เมื่อวาน',
  },
  {
    id: 'b-6',
    type: 'offer',
    title: 'ว่าง! Majesty ผู้บริหาร รับ-ส่งสนามบิน + ประชุมในเมือง',
    zoneId: 'city',
    date: '21 ก.ย. 69',
    days: 1,
    seats: 4,
    price: 3200,
    priceNote: 'รวมน้ำมันในเมือง ออกใบกำกับภาษีได้',
    authorName: 'พี่พจน์ VIP Limo',
    authorPhone: '086-555-1234',
    authorLine: 'https://line.me',
    vehicleLabel: 'Toyota Majesty 7 ที่นั่ง',
    detail: 'รับผู้บริหารจากสนามบิน ตระเวนประชุมในเมืองทั้งวัน คนขับสวมสูท ตรงเวลา มีเอกสารใบกำกับภาษีเต็มรูป',
    postedAt: '2 วันที่แล้ว',
    isVerified: true,
  },
];
