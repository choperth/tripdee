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
  /** รูปแบบบริการ: with_driver = รถพร้อมคนขับ, self_drive = รถเช่าขับเอง */
  rentalType?: 'with_driver' | 'self_drive';
  /** ระบบเกียร์: auto = เกียร์อัตโนมัติ, manual = เกียร์ธรรมดา */
  transmission?: 'auto' | 'manual';
  /** รายการวันที่ติดงาน/คิวเต็ม (ISO date strings: "YYYY-MM-DD") */
  busyDates?: string[];
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
  regionCategory?: 'north' | 'south' | 'east' | 'central' | 'all';
  distanceTime?: string;
  regionBadge?: string;
  plateBadge?: string;
  badgeTags?: string[];
  startingDailyRate?: number;
  otaStandardRate?: number;
  savingsAmount?: number;
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
    highlight: 'จุดชมวิวสันเขา หมู่บ้านม้งหนองหอย และแปลงพืชเมืองหนาว',
    image: 'https://images.unsplash.com/photo-1770740098141-4db5fb079dd1?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,500 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP / SUV',
    regionCategory: 'north',
    distanceTime: 'หมู่บ้านม้งหนองหอย · เดินทางจากตัวเมืองเชียงใหม่ราว 40 นาที',
    regionBadge: 'ภาคเหนือ · เชียงใหม่',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['จุดชมวิวม่อนล่อง', 'หมู่บ้านม้งหนองหอย', 'แปลงพืชเมืองหนาว', 'ทะเลหมอกตามฤดูกาล'],
    startingDailyRate: 2500,
    otaStandardRate: 3200,
    savingsAmount: 700,
  },
  {
    id: 'inthanon',
    name: 'ดอยอินทนนท์ - กิ่วแม่ปาน (เชียงใหม่)',
    filterKey: 'ดอยอินทนนท์',
    zone: 'ภาคเหนือ / ดอยสูง',
    highlight: 'จุดสูงสุดแดนสยาม พระมหาธาตุฯ น้ำตกวชิรธาร เส้นทางศึกษาธรรมชาติ',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Doi_inthanon_03.jpg/960px-Doi_inthanon_03.jpg',
    estimatedPrice: '2,800 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP เครื่องแรงชำนาญทาง',
    regionCategory: 'north',
    distanceTime: '106 km · 2.2 hrs สู่ยอดดอยสูงสุด',
    regionBadge: 'ภาคเหนือ · ดอยสูงสุด',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['จุดชมวิวทะเลหมอก', 'เส้นทางเดินศึกษาธรรมชาติ', 'พระมหาธาตุเจดีย์', 'คนขับชำนาญทางดอย'],
    startingDailyRate: 2800,
    otaStandardRate: 3800,
    savingsAmount: 1000,
  },
  {
    id: 'phuket-phangnga',
    name: 'ภูเก็ต - พังงา - เสม็ดนางชี',
    filterKey: 'ภูเก็ต',
    zone: 'ภาคใต้ / ทะเลอันดามัน',
    highlight: 'จุดชมวิวอ่าวพังงา หาดป่าตอง เมืองเก่าภูเก็ต แหลมพรหมเทพ',
    image: 'https://images.unsplash.com/photo-1653409625515-629bed947ddc?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '3,000 บ./วัน',
    recommendedVehicle: 'All New Commuter VIP',
    regionCategory: 'south',
    distanceTime: '85 km · 1.5 hrs ทริปอันดามัน',
    regionBadge: 'ภาคใต้ · ทะเลอันดามัน',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['เสม็ดนางชี', 'ท่าเรืออ่าวพังงา', 'เกาะเจหลี', 'รับส่งสนามบินภูเก็ต (HKT)'],
    startingDailyRate: 3000,
    otaStandardRate: 4200,
    savingsAmount: 1200,
  },
  {
    id: 'khao-yai',
    name: 'กรุงเทพฯ - เขาใหญ่ - ปากช่อง',
    filterKey: 'เขาใหญ่',
    zone: 'ภาคอีสาน / อากาศบริสุทธิ์',
    highlight: 'อุทยานแห่งชาติเขาใหญ่ ไร่องุ่น คาเฟ่ธรรมชาติ สัมมนากลุ่ม',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Khao_Yai%2C_Thailand%2C_Tropical_grasslands.jpg/960px-Khao_Yai%2C_Thailand%2C_Tropical_grasslands.jpg',
    estimatedPrice: '2,700 บ./วัน',
    recommendedVehicle: 'Toyota Commuter / SUV 4WD',
    regionCategory: 'central',
    distanceTime: '165 km · 2.5 hrs จากกรุงเทพฯ',
    regionBadge: 'ภาคอีสาน · มรดกโลก',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['อุทยานแห่งชาติ', 'ไร่องุ่น & คาเฟ่', 'ที่พักสไตล์ยุโรป', 'เหมาะสำหรับครอบครัว'],
    startingDailyRate: 2700,
    otaStandardRate: 3500,
    savingsAmount: 800,
  },
  {
    id: 'bkk-pattaya',
    name: 'กรุงเทพฯ - พัทยา - สัตหีบ',
    filterKey: 'พัทยา',
    zone: 'ภาคตะวันออก / ทะเล',
    highlight: 'แหลมบาลีฮาย สวนนงนุช เกาะล้าน ท่องเที่ยวชายทะเล',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,400 บ./วัน',
    recommendedVehicle: 'Toyota Majesty / VIP Van',
    regionCategory: 'east',
    distanceTime: '140 km · 1.8 hrs ชายทะเลตะวันออก',
    regionBadge: 'ภาคตะวันออก · อ่าวไทย',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['หาดทรายแก้ว', 'สวนนงนุช', 'เรือรบหลวงจักรีนฤเบศร', 'รับส่งสุวรรณภูมิ/อู่ตะเภา'],
    startingDailyRate: 2400,
    otaStandardRate: 3100,
    savingsAmount: 700,
  },
  {
    id: 'bkk-huahin',
    name: 'กรุงเทพฯ - ชะอำ - หัวหิน',
    filterKey: 'หัวหิน',
    zone: 'ภาคกลาง / พักผ่อนตากอากาศ',
    highlight: 'ชายหาดหัวหิน ตลาดซิเคด้า พระราชนิเวศน์มฤคทายวัน',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,600 บ./วัน',
    recommendedVehicle: 'Toyota Majesty / VIP Van',
    regionCategory: 'central',
    distanceTime: '190 km · 2.8 hrs พักผ่อนตากอากาศ',
    regionBadge: 'ภาคกลาง · ชายหาดหัวหิน',
    plateBadge: 'ป้ายเหลือง 30',
    badgeTags: ['ชายหาดหัวหิน', 'ตลาดซิเคด้า', 'พระราชนิเวศน์มฤคทายวัน', 'ขับนุ่มสบายครอบครัว'],
    startingDailyRate: 2600,
    otaStandardRate: 3400,
    savingsAmount: 800,
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
    busyDates: ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28'],
  },
  {
    id: 'v-1b',
    title: 'Toyota Fortuner 2.8 4WD 7 ที่นั่ง ลุยดอยสูงพร้อมคนขับ (พี่ชัย รถตู้เชียงใหม่)',
    type: 'suv',
    rentalType: 'with_driver',
    seats: 7,
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
    reviewCount: 31,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 2000, midHill: 2200, highHill: 2400, crossProvince: 2800 },
    location: 'เชียงใหม่ / ม่อนแจ่ม / ดอยอินทนนท์ / ภาคเหนือ',
    popularRoutes: ['ม่อนแจ่ม', 'ดอยอินทนนท์', 'แม่กำปอง', 'เชียงดาว', 'ปาย'],
    amenities: [
      'ระบบขับเคลื่อน 4 ล้อแท้ ขึ้นดอยชันปลอดภัย',
      'เบาะหนัง 7 ที่นั่ง แอร์เย็นฉ่ำทุกแถว',
      'คนขับชำนาญทางดอยอินทนนท์และแม่ฮ่องสอน',
      'ประกันภัยผู้โดยสารชั้น 1',
    ],
    description: 'SUV 4WD ลุยเขาดอยสูง สำหรับลูกค้ากลุ่มเล็ก 4-6 ท่านที่ต้องการความคล่องตัว นั่งสบาย คนขับคนเดิมชำนาญทาง มั่นใจในความปลอดภัย',
    plateType: 'blue',
    plateNumber: 'กข-9821 ชม.',
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
    id: 'v-2b',
    title: 'Toyota Alphard SC Package VIP 7 ที่นั่ง สไตล์ผู้บริหาร (พี่พจน์ VIP Limo)',
    type: 'van',
    rentalType: 'with_driver',
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
    reviewCount: 26,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 3800, midHill: 4000, highHill: 4200, crossProvince: 4800 },
    rateNote: 'หรูหราพรีเมียมสูงสุด ออกใบกำกับภาษีได้',
    location: 'กรุงเทพฯ & ปริมณฑล / พัทยา / หัวหิน / อยุธยา',
    popularRoutes: ['กรุงเทพฯ', 'สนามบินสุวรรณภูมิ', 'พัทยา', 'หัวหิน'],
    amenities: [
      'เบาะ Mickey Mouse ปรับไฟฟ้าพร้อมที่รองน่อง',
      'หลังคามูนรูฟคู่ Twin Moonroof',
      'ระบบเสียงรอบทิศทาง',
      'คนขับแต่งกายสุภาพ สื่อสารภาษาอังกฤษและจีนได้',
    ],
    description: 'รถตู้หรูระดับลักชัวรี่ นุ่มนวล เงียบสนิท เหมาะสำหรับรับรองแขกระดับ VIP งานประชุมระดับนานาชาติ หรือทริปครอบครัวสุดพิเศษ',
    plateType: 'yellow',
    plateNumber: '30-8899 กทม.',
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
    rentalType: 'with_driver',
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
    rentalType: 'with_driver',
  },
  {
    id: 'v-10',
    title: 'Isuzu MU-X Ultimate 3.0 4WD 7 ที่นั่ง เบาะ CoolMax นุ่มสบาย (พี่วิทย์ นอร์ธเทิร์นทราเวล)',
    type: 'suv',
    rentalType: 'with_driver',
    seats: 7,
    driverName: 'นายสุวิทย์ อัครเดช',
    driverNickname: 'พี่วิทย์ MU-X VIP',
    driverPhone: '082-667-8899',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66826678899',
    languages: ['th', 'en'],
    region: 'north',
    rating: 4.9,
    reviewCount: 34,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
    location: 'เชียงใหม่ / แม่ฮ่องสอน / เชียงราย / ปาย / ปางอุ๋ง',
    popularRoutes: ['ปาย', 'แม่ฮ่องสอน', 'ดอยอินทนนท์', 'ม่อนแจ่ม', 'เชียงดาว'],
    amenities: [
      'SUV 7 ที่นั่ง ขับเคลื่อน 4 ล้อแท้ ขึ้นเขาสูงชันนุ่มนวล',
      'เบาะหนังแท้ CoolMax ระบายความร้อน แอร์เย็นฉ่ำ 3 ตอน',
      'คนขับชำนาญโค้งปายและแม่ฮ่องสอน ประสบการณ์กว่า 15 ปี',
      'ประกันภัยผู้โดยสารชั้น 1 คุ้มครองเต็มวงเงิน',
      'พร้อมน้ำดื่มบริการและจุดชาร์จสมาร์ตโฟน',
    ],
    description: 'SUV 7 ที่นั่ง ยอดนิยมสำหรับทริปครอบครัวและกลุ่มเพื่อน 4-6 ท่าน สมรรถนะสูง เกาะถนนหนึบ นั่งสบายตลอดเส้นทาง คนขับใจเย็น ปลอดภัย สุภาพ ชำนาญจุดแวะถ่ายรูปสวยงาม',
    plateType: 'blue',
    plateNumber: 'กต-7812 ชม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-11',
    title: 'Honda CR-V e:HEV RS 7 ที่นั่ง ไฮบริดฟูลออปชัน เงียบหรู (กทม. & พัทยา & ระยอง)',
    type: 'suv',
    rentalType: 'with_driver',
    seats: 7,
    driverName: 'นายมานพ ธนกิจ',
    driverNickname: 'พี่มานพ พรีเมียม SUV',
    driverPhone: '085-334-9911',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66853349911',
    driverWechat: 'bkk_crv_vip',
    languages: ['th', 'en'],
    region: 'central',
    rating: 5.0,
    reviewCount: 28,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 2200, midHill: 2400, highHill: 2600, crossProvince: 3000 },
    location: 'กรุงเทพฯ & ปริมณฑล / พัทยา / ระยอง / หัวหิน / เขาใหญ่',
    popularRoutes: ['กรุงเทพฯ', 'พัทยา', 'ระยอง', 'เขาใหญ่', 'สนามบินสุวรรณภูมิ'],
    amenities: [
      'ระบบไฮบริด Full Hybrid ขับสนิท นุ่มนวล ไร้เสียงรบกวน',
      'เบาะ 3 แถว 7 ที่นั่ง หลังคา Panoramic Sunroof',
      'ระบบความปลอดภัย Honda SENSING รอบคัน',
      'คนขับผ่านการตรวจประวัติอาชญากรรม แต่งกายสุภาพ',
      'ออกใบเสร็จรับเงิน/ใบกำกับภาษีได้',
    ],
    description: 'รถยนต์ SUV ระดับพรีเมียม 7 ที่นั่ง ตอบโจทย์ครอบครัวยุคใหม่ที่ต้องการความหรูหรา นุ่มนวล และทัศนวิสัยที่ดีเยี่ยม เหมาะสำหรับรับส่งสนามบิน ทริปตีกอล์ฟ หรือพักผ่อนวันหยุดสุดสัปดาห์',
    plateType: 'blue',
    plateNumber: '7กง-4422 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-12',
    title: 'Mercedes-Benz E-Class Executive Sedan 4 ที่นั่ง รับรองผู้บริหาร (กทม. & สนามบิน)',
    type: 'car',
    rentalType: 'with_driver',
    seats: 4,
    driverName: 'นายธนพล ลิมูซีน',
    driverNickname: 'คุณธนพล Benz Executive',
    driverPhone: '081-778-9922',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66817789922',
    driverWechat: 'benz_eclass_bkk',
    languages: ['th', 'en'],
    region: 'central',
    rating: 5.0,
    reviewCount: 41,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 3500, midHill: 3800, highHill: 4200, crossProvince: 4800 },
    rateNote: 'ลักชัวรี่พรีเมียม แต่งกายสูทสากล พร้อมน้ำแร่ต้อนรับ',
    location: 'กรุงเทพฯ / สนามบินสุวรรณภูมิ (BKK) / ดอนเมือง (DMK) / ชลบุรี',
    popularRoutes: ['กรุงเทพฯ', 'สนามบินสุวรรณภูมิ', 'สนามบินดอนเมือง', 'พัทยา'],
    amenities: [
      'ห้องโดยสารระดับ First Class เบาะหนังแท้ปรับไฟฟ้าพร้อม Memory',
      'ระบบเสียงพรีเมียมรอบทิศทาง Burmester',
      'คนขับผ่านการอบรม VVIP แต่งกายสูทสากล สุภาพ ตรงต่อเวลา',
      'บริการน้ำดื่ม ผ้าเย็น และ Wi-Fi ฟรีบนรถ',
      'ออกใบกำกับภาษีเต็มรูปแบบในนามบริษัทได้',
    ],
    description: 'ที่สุดของยานยนต์ซีดานหรูระดับผู้บริหาร สำหรับการรับรองแขก VIP แขกต่างประเทศ ประชุมสัมมนาธุรกิจ งานแต่งงาน หรือการเดินทางสุดพิเศษในเมืองหลวง',
    plateType: 'yellow',
    plateNumber: '30-9900 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-cm01',
    title: 'Toyota Yaris Ativ Sport Eco Car เกียร์ออโต้ 5 ที่นั่ง (ซีเอ็นเอ็กซ์ คาร์เร้นท์)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'หจก. ซีเอ็นเอ็กซ์ ทราเวล & คาร์เร้นท์',
    driverNickname: 'ซีเอ็นเอ็กซ์ คาร์เร้นท์ (สนามบินเชียงใหม่)',
    driverPhone: '089-755-1122',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66897551122',
    languages: ['th', 'en'],
    region: 'north',
    rating: 4.9,
    reviewCount: 52,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 850, midHill: 850, highHill: 850, crossProvince: 850 },
    rateNote: 'ราคาเช่าขับเอง 24 ชม. ไม่รวมน้ำมัน (มัดจำและจุดรับรถสอบถามทางร้านโดยตรง)',
    location: 'เชียงใหม่ / สนามบินเชียงใหม่ (CNX) / ตัวเมือง',
    popularRoutes: ['สนามบินเชียงใหม่', 'นิมมาน', 'แม่ริม', 'ม่อนแจ่ม', 'หางดง'],
    amenities: [
      'เกียร์อัตโนมัติ CVT ขับง่ายประหยัดน้ำมัน',
      'Apple CarPlay / Android Auto พร้อมกล้องถอยหลัง',
      'ระบบแอร์เย็นฉ่ำ สภาพรถใหม่สะอาด',
      'จุดนัดรับโซนสนามบินเชียงใหม่และตัวเมือง',
      'มีประกันภัยรถเช่า (สอบถามประเภทกรมธรรม์กับทางร้าน)'
    ],
    description: 'รถเก๋ง Eco Car สภาพใหม่เอี่ยม สะอาด ประหยัดน้ำมัน คล่องตัวสูง เหมาะสำหรับขับเที่ยวในเมืองเชียงใหม่ แม่ริม หางดง คาเฟ่ ช้อปปิ้ง ติดต่อจองและนัดหมายจุดรับรถกับทางร้านได้โดยตรง',
    plateType: 'blue',
    plateNumber: 'งข-5124 ชม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-cm02',
    title: 'Toyota Fortuner 2.8 4WD 7 ที่นั่ง ลุยดอยสูง (เชียงใหม่ ออฟโรด เร้นท์ทอล)',
    type: 'suv',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 7,
    driverName: 'นายธีรภัทร ยอดดอย',
    driverNickname: 'เชียงใหม่ ออฟโรด & เอสยูวี',
    driverPhone: '081-884-3322',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'north',
    rating: 5.0,
    reviewCount: 44,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 2200, midHill: 2200, highHill: 2200, crossProvince: 2200 },
    rateNote: 'ขับเคลื่อน 4 ล้อแท้ สมรรถนะสูง ขึ้นดอยปลอดภัย (สอบถามเงื่อนไขมัดจำกับทางร้าน)',
    location: 'เชียงใหม่ / ดอยอินทนนท์ / อ่างขาง / ปาย',
    popularRoutes: ['ดอยอินทนนท์', 'ม่อนแจ่ม', 'ดอยอ่างขาง', 'เชียงดาว', 'ปาย'],
    amenities: [
      'ระบบขับเคลื่อน 4 ล้อ (4WD Part-time)',
      'เครื่องยนต์ดีเซล 2.8 เทอร์โบ กำลังขับขึ้นเขาสูงชัน',
      'เบาะหนัง 3 แถว 7 ที่นั่ง พับปรับบรรทุกสัมภาระได้',
      'มีบริการนัดรับรถสนามบินและโรงแรมในตัวเมือง',
      'ประกันภัยรถเช่า (สอบถามรายละเอียดความคุ้มครองกับร้าน)'
    ],
    description: 'รถ SUV ขับเคลื่อน 4 ล้อ พลังแรง ยึดเกาะถนนดีเยี่ยม ออกแบบมาเพื่อการเดินทางท่องเที่ยวขึ้นดอยสูง โค้งชัน และเส้นทางธรรมชาติของภาคเหนือโดยเฉพาะ สภาพรถสมบูรณ์ เช็กศูนย์สม่ำเสมอ',
    plateType: 'blue',
    plateNumber: 'ขข-8942 ชม.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-sd-cm03',
    title: 'Honda City e:HEV RS ไฮบริดประหยัดน้ำมัน 5 ที่นั่ง (ล้านนา สมาร์ทคาร์)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'บริษัท ล้านนา สมาร์ทคาร์ เร้นท์ จำกัด',
    driverNickname: 'ล้านนา สมาร์ทคาร์ เชียงใหม่',
    driverPhone: '086-342-9900',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'north',
    rating: 4.8,
    reviewCount: 29,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1050, midHill: 1050, highHill: 1050, crossProvince: 1050 },
    rateNote: 'ไฮบริดประหยัดน้ำมันกว่า 27 กม./ลิตร ออกใบกำกับภาษีได้',
    location: 'เชียงใหม่ / สนามบิน / มหาวิทยาลัยเชียงใหม่ / นิมมาน',
    popularRoutes: ['นิมมาน', 'สนามบินเชียงใหม่', 'แม่กำปอง', 'เชียงราย'],
    amenities: [
      'ระบบไฮบริด Full Hybrid e:HEV แรงและประหยัดน้ำมัน',
      'ระบบความปลอดภัย Honda SENSING',
      'เบาะทรงสปอร์ตพร้อมแอร์ผู้โดยสารตอนหลัง',
      'จุดส่งมอบสนามบินเชียงใหม่และสถานีรถไฟ',
      'ออกใบกำกับภาษีเต็มรูปแบบในนามนิติบุคคลได้'
    ],
    description: 'รถยนต์พลังงานไฮบริดรุ่นท็อป RS สมรรถนะการขับขี่เร่งแซงทันใจแต่ประหยัดน้ำมันเป็นเลิศ ขับขึ้นเขาลงห้วยสบาย มั่นใจด้วยระบบความปลอดภัยรอบคัน เอกสารครบถ้วน',
    plateType: 'blue',
    plateNumber: 'จข-1934 ชม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-pkt01',
    title: 'Toyota Yaris Cross HEV Premium Luxury 5 ที่นั่ง (อันดามัน ออโต้เร้นท์ ภูเก็ต)',
    type: 'suv',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'บริษัท อันดามัน ออโต้เร้นท์ จำกัด',
    driverNickname: 'อันดามัน ออโต้เร้นท์ ภูเก็ต',
    driverPhone: '088-765-4321',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66887654321',
    languages: ['th', 'en', 'zh'],
    region: 'south',
    rating: 4.9,
    reviewCount: 68,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1350, midHill: 1350, highHill: 1350, crossProvince: 1350 },
    rateNote: 'Compact SUV ยกสูง ขับเที่ยวรอบเกาะภูเก็ตสะดวก (ติดต่อสอบถามจุดนัดรับ)',
    location: 'ภูเก็ต / สนามบินภูเก็ต (HKT) / ป่าตอง / กะตะ / ตัวเมือง',
    popularRoutes: ['สนามบินภูเก็ต', 'หาดป่าตอง', 'แหลมพรหมเทพ', 'เมืองเก่าภูเก็ต', 'พังงา'],
    amenities: [
      'Compact SUV ไฮบริด ทัศนวิสัยกว้าง ขับขี่คล่องตัว',
      'เบาะหนังปรับไฟฟ้าและระบบเบรกมือไฟฟ้า Auto Brake Hold',
      'กล้องรอบทิศทาง 360 องศา จอดง่ายแม้ที่แคบ',
      'จุดนัดรับโซนสนามบินภูเก็ตและหาดป่าตอง',
      'เจ้าหน้าที่สื่อสารภาษาอังกฤษและจีนได้'
    ],
    description: 'รถยนต์ Compact SUV รุ่นยอดนิยมในภูเก็ต ยกสูงลุยแอ่งน้ำหรือทางลาดชันบนเกาะได้อย่างมั่นใจ ประหยัดน้ำมันด้วยขุมพลังไฮบริด รับรถสะดวกบริเวณสนามบินภูเก็ตและแหล่งท่องเที่ยวสำคัญ',
    plateType: 'blue',
    plateNumber: 'กพ-6655 ภก.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-pkt02',
    title: 'Honda HR-V e:HEV Crossover 5 ที่นั่ง (ภูเก็ต ไดรฟ์วิ่ง เซ็นเตอร์)',
    type: 'suv',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'นายกิตติคุณ อันดามันคาร์',
    driverNickname: 'ภูเก็ต ไดรฟ์วิ่ง เซ็นเตอร์',
    driverPhone: '083-999-5566',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'south',
    rating: 4.8,
    reviewCount: 35,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1450, midHill: 1450, highHill: 1450, crossProvince: 1450 },
    rateNote: 'เบาะหลังพับได้อิสระ จุสัมภาระและกระเป๋าเดินทางขนาดใหญ่ได้เยอะ',
    location: 'ภูเก็ต / ถลาง / ฉลอง / ราไวย์ / สนามบิน',
    popularRoutes: ['หาดกะรน', 'หาดกะตะ', 'แหลมพรหมเทพ', 'สนามบินภูเก็ต'],
    amenities: [
      'เบาะ Ultra Seat พับราบและพับยกขึ้นได้หลากหลาย',
      'หลังคากระจก Panoramic Glass Roof รับแสงธรรมชาติ',
      'ระบบนำทาง GPS รองรับ Apple CarPlay ไร้สาย',
      'มีบริการส่งมอบรถตามจุดนัดหมายในภูเก็ต',
      'สอบถามเงื่อนไขเงินมัดจำและการชำระเงินกับทางร้าน'
    ],
    description: 'Crossover หรู สไตล์สปอร์ต ห้องโดยสารอเนกประสงค์ พับเบาะบรรจุถุงกอล์ฟ กระเป๋าเดินทางขนาด 28 นิ้ว หรือเซิร์ฟบอร์ดได้สบาย ขับสนุก เงียบ และนุ่มนวล',
    plateType: 'blue',
    plateNumber: 'กม-4188 ภก.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-sd-kb01',
    title: 'Suzuki Swift 1.2 GLX Eco Car 5 ที่นั่ง (อ่าวนาง & กระบี่ คาร์เร้นท์)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'นายสมเกียรติ สันติสุข',
    driverNickname: 'อ่าวนาง & กระบี่ คาร์เร้นท์',
    driverPhone: '084-222-7788',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'south',
    rating: 4.9,
    reviewCount: 42,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 800, midHill: 800, highHill: 800, crossProvince: 800 },
    rateNote: 'ราคาประหยัด คล่องตัวสูง นัดรับสนามบินกระบี่หรืออ่าวนางได้',
    location: 'กระบี่ / อ่าวนาง / สนามบินกระบี่ (KBV) / คลองม่วง',
    popularRoutes: ['สนามบินกระบี่', 'อ่าวนาง', 'สระมรกต', 'ท่าปอมคลองสองน้ำ'],
    amenities: [
      'เกียร์อัตโนมัติ CVT คล่องตัว หาที่จอดง่าย',
      'ปุ่มสตาร์ท Push Start & กุญแจ Keyless',
      'ระบบปรับอากาศอัตโนมัติ เย็นเร็วสู้แดด',
      'จุดส่งมอบโซนสนามบินกระบี่และหาดอ่าวนาง',
      'ยินดีรับทั้งเงินสดและเงินโอนมัดจำ'
    ],
    description: 'รถเก๋งไซส์กะทัดรัดยอดนิยมสำหรับเที่ยวกระบี่ ขับง่าย ซอกแซกตามถนนเลียบหาดและแหล่งท่องเที่ยวสะดวก ทัศนวิสัยดี ดูแลความสะอาดอย่างดีทุกครั้งก่อนส่งมอบ',
    plateType: 'blue',
    plateNumber: 'กค-3991 กบ.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-sd-bkk01',
    title: 'Toyota Corolla Altis 1.8 Hybrid 5 ที่นั่ง (สยาม คาร์ ลิสซิ่ง สุวรรณภูมิ/ดอนเมือง)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'บริษัท สยาม คาร์ ลิสซิ่ง แอนด์ ทราเวล จำกัด',
    driverNickname: 'สยาม ลิสซิ่ง (สุวรรณภูมิ/ดอนเมือง)',
    driverPhone: '085-888-3456',
    driverLine: 'https://line.me',
    driverWhatsapp: 'https://wa.me/66858883456',
    languages: ['th', 'en', 'zh'],
    region: 'central',
    rating: 4.9,
    reviewCount: 82,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1150, midHill: 1150, highHill: 1150, crossProvince: 1150 },
    rateNote: 'ออกใบกำกับภาษีเต็มรูป + หัก ณ ที่จ่าย 3% ได้ สะดวกสำหรับนิติบุคคล',
    location: 'กรุงเทพฯ / สนามบินสุวรรณภูมิ (BKK) / ดอนเมือง (DMK)',
    popularRoutes: ['สนามบินสุวรรณภูมิ', 'สนามบินดอนเมือง', 'พัทยา', 'หัวหิน', 'อยุธยา'],
    amenities: [
      'ซีดานไฮบริด นุ่มนวล เงียบ ประหยัดน้ำมัน',
      'รองรับจุดรับ-ส่งทั้งสนามบินสุวรรณภูมิและดอนเมือง',
      'ออกใบเสร็จรับเงิน/ใบกำกับภาษีเต็มรูปแบบได้',
      'มีบริการรูดล็อควงเงินบัตรเครดิตสำหรับเงินประกัน',
      'เปิดให้บริการและนัดหมายรับรถได้ตลอด 24 ชม.'
    ],
    description: 'รถเก๋งซีดานขนาดกลางยอดนิยมอันดับหนึ่ง เหมาะสำหรับทั้งการเดินทางเพื่อธุรกิจและการท่องเที่ยวพักผ่อน ห้องโดยสารกว้างขวาง นั่งสบาย นุ่มนวล เดินทางไกลข้ามจังหวัดไม่เมื่อยล้า',
    plateType: 'blue',
    plateNumber: '8กฮ-2411 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-bkk02',
    title: 'Honda Civic EL+ 1.5 Turbo สปอร์ตซีดาน 5 ที่นั่ง (บีเคเค ไดรฟ์ เร้นท์ทอล)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'นายวรวิทย์ ไดรฟ์วิ่งทัวร์',
    driverNickname: 'บีเคเค ไดรฟ์ เร้นท์ทอล',
    driverPhone: '087-444-1234',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'central',
    rating: 4.8,
    reviewCount: 37,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1400, midHill: 1400, highHill: 1400, crossProvince: 1400 },
    rateNote: 'เครื่องยนต์ VTEC Turbo 178 แรงม้า ขับสนุก เร่งแซงทันใจ',
    location: 'กรุงเทพฯ / บางนา / สุขุมวิท / สุวรรณภูมิ',
    popularRoutes: ['กรุงเทพฯ', 'เขาใหญ่', 'พัทยา', 'หัวหิน'],
    amenities: [
      'เครื่องยนต์ 1.5 Turbo สมรรถนะสูง',
      'ระบบความปลอดภัยอัจฉริยะ Honda SENSING',
      'เบาะหนังปรับไฟฟ้าคู่หน้า ดีไซน์สปอร์ตพรีเมียม',
      'จุดส่งมอบรถโซนกรุงเทพฯ ฝั่งตะวันออกและสุวรรณภูมิ',
      'สอบถามเงื่อนไขการจองและเอกสารเช่ากับร้านโดยตรง'
    ],
    description: 'สปอร์ตซีดานดีไซน์โฉบเฉี่ยว อัตราเร่งดีเยี่ยม เกาะถนนมั่นใจ ตอบโจทย์ผู้ที่ชื่นชอบการขับขี่รถยนต์สมรรถนะสูง เหมาะสำหรับทริปขับเที่ยวกรุงเทพฯ-เขาใหญ่ หรือพัทยา',
    plateType: 'blue',
    plateNumber: '2ขศ-7890 กทม.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-sd-bkk03',
    title: 'Toyota Majesty Executive 7 ที่นั่ง ขับเองพรีเมียม VIP (ไพร์ม ลักชัวรี่ โมบิลิตี้)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 7,
    driverName: 'บริษัท ไพร์ม ลักชัวรี่ โมบิลิตี้ จำกัด',
    driverNickname: 'ไพร์ม ลักชัวรี่ กทม.',
    driverPhone: '081-333-8899',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'central',
    rating: 5.0,
    reviewCount: 26,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 3500, midHill: 3500, highHill: 3500, crossProvince: 3500 },
    rateNote: 'รถตู้หรูขับเอง เบาะ Captain Seat สำหรับครอบครัวใหญ่ที่ต้องการความเป็นส่วนตัว',
    location: 'กรุงเทพฯ / นนทบุรี / ปริมณฑล / สุวรรณภูมิ',
    popularRoutes: ['กรุงเทพฯ', 'หัวหิน', 'พัทยา', 'เขาใหญ่'],
    amenities: [
      'เบาะ Captain Seat ปรับไฟฟ้า พร้อมที่พักน่อง',
      'ประตูสไลด์ไฟฟ้าคู่ 2 ฝั่ง ควบคุมง่าย',
      'กล้อง 360 องศา และเซนเซอร์รอบคัน ช่วยจอดสะดวก',
      'ออกใบกำกับภาษีเต็มรูปแบบในนามนิติบุคคลได้',
      'รับรถได้ทั้งที่ศูนย์บริการหรือนัดส่งมอบ'
    ],
    description: 'สำหรับครอบครัวใหญ่หรือกลุ่มผู้บริหารที่ต้องการขับรถท่องเที่ยวด้วยตัวเองอย่างเป็นส่วนตัวสูงสุด หรูหรา สะดวกสบาย ขับง่ายด้วยทัศนวิสัยที่ดีเยี่ยมและระบบช่วยเหลือการขับขี่รอบคัน',
    plateType: 'blue',
    plateNumber: '1นข-9900 กทม.',
    canIssueTaxInvoice: true,
    businessType: 'company',
    isAvailable: true,
  },
  {
    id: 'v-sd-pty01',
    title: 'Toyota Veloz Smart 7 ที่นั่ง Mini MPV ครอบครัว (พัทยา ซิตี้ คาร์เร้นท์)',
    type: 'suv',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 7,
    driverName: 'นายธนาธิป ชลเจริญ',
    driverNickname: 'พัทยา ซิตี้ คาร์เร้นท์',
    driverPhone: '082-998-1122',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'east',
    rating: 4.8,
    reviewCount: 38,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1200, midHill: 1200, highHill: 1200, crossProvince: 1200 },
    rateNote: '7 ที่นั่ง คุ้มค่า จุคนและของได้เยอะ เหมาะกับทริปพัทยา-สัตหีบ',
    location: 'พัทยา / บางละมุง / หาดจอมเทียน / สัตหีบ / สนามบินอู่ตะเภา',
    popularRoutes: ['พัทยา', 'สัตหีบ', 'หาดจอมเทียน', 'สวนนงนุช', 'ระยอง'],
    amenities: [
      'เบาะ 3 แถว 7 ที่นั่ง ปรับเปลี่ยนรูปแบบได้หลากหลาย',
      'ระบบชาร์จโทรศัพท์ไร้สาย Wireless Charger',
      'หน้าจอสัมผัสรองรับ Apple CarPlay / Android Auto',
      'จุดนัดรับโซนพัทยาเหนือ-กลาง-ใต้ และหาดจอมเทียน',
      'ยินดีรับเงินสดและเงินโอนมัดจำ'
    ],
    description: 'Mini MPV 7 ที่นั่ง อเนกประสงค์ เหมาะมากสำหรับทริปครอบครัวหรือกลุ่มเพื่อนที่มาเที่ยวพักผ่อนพัทยา สัตหีบ เกาะล้าน จุคนและสัมภาระได้ครบครันในราคาประหยัด',
    plateType: 'blue',
    plateNumber: 'ขข-5512 ชบ.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  },
  {
    id: 'v-sd-sm01',
    title: 'Toyota Yaris Ativ 5 ที่นั่ง ขับเที่ยวรอบเกาะ (สมุย ไอแลนด์ เร้นท์ อะ คาร์)',
    type: 'car',
    rentalType: 'self_drive',
    transmission: 'auto',
    seats: 5,
    driverName: 'นายพงษ์ศักดิ์ สมุยทราเวล',
    driverNickname: 'สมุย ไอแลนด์ เร้นท์ อะ คาร์',
    driverPhone: '089-441-2334',
    driverLine: 'https://line.me',
    languages: ['th', 'en'],
    region: 'south',
    rating: 4.9,
    reviewCount: 47,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 950, midHill: 950, highHill: 950, crossProvince: 950 },
    rateNote: 'ขับเที่ยวรอบเกาะสมุยคล่องตัว นัดรับที่ท่าเรือหรือสนามบินสมุยได้',
    location: 'เกาะสมุย / สนามบินสมุย (USM) / ท่าเรือหน้าทอน / หาดเฉวง',
    popularRoutes: ['หาดเฉวง', 'หาดละไม', 'บ่อผุด', 'ท่าเรือหน้าทอน', 'สนามบินสมุย'],
    amenities: [
      'เกียร์อัตโนมัติ ขับง่ายบนเส้นทางรอบเกาะ',
      'เครื่องปรับอากาศเย็นเร็ว สู้แดดเกาะสมุย',
      'จุดส่งมอบท่าเรือหน้าทอน ท่าเรือลิปะน้อย และสนามบินสมุย',
      'แถมแผนที่แนะนำจุดท่องเที่ยวและคาเฟ่รอบเกาะ',
      'สอบถามเงื่อนไขมัดจำและนัดหมายเวลารับรถกับร้าน'
    ],
    description: 'รถเก๋งยอดนิยมสำหรับขับเที่ยวบนเกาะสมุย ขับง่าย เลี้ยวกลับรถสะดวก หาที่จอดตามคาเฟ่และชายหาดง่าย แอร์เย็นฉ่ำ ดูแลความสะอาดอย่างดี',
    plateType: 'blue',
    plateNumber: 'กง-7733 สฎ.',
    canIssueTaxInvoice: false,
    businessType: 'individual',
    isAvailable: true,
  }
];

export type BoardPostType = 'request' | 'offer';

export interface BoardQuote {
  id: string;
  postId: string;
  driverName: string;
  driverPhone: string;
  driverLine?: string;
  vehicleModel: string;
  price: number;
  priceNote?: string;
  message?: string;
  createdAt: string;
}

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
  /** โหมดราคาตามตกลง / รอคนขับยื่นใบเสนอราคา */
  isNegotiable?: boolean;
  /** จำนวนโควตารับใบเสนอราคาสูงสุด (ค่าเริ่มต้น 3) */
  maxQuotes?: number;
  /** จำนวนใบเสนอราคาที่ได้รับแล้ว */
  quoteCount?: number;
  /** รหัสใบเสนอราคาที่ลูกค้ายอมรับแล้ว */
  acceptedQuoteId?: string;
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
  {
    id: 'b-7',
    type: 'request',
    title: 'หารถตู้ VIP 10 ที่นั่ง เชียงใหม่-ปาย-ปางอุ๋ง 3 วัน 2 คืน (รอคนขับเสนอราคา)',
    zoneId: 'highHill',
    date: '3-5 ต.ค. 69',
    days: 3,
    seats: 9,
    price: 0,
    priceNote: 'รอคนขับเสนอราคา',
    isNegotiable: true,
    maxQuotes: 3,
    quoteCount: 1,
    authorName: 'คุณวรัญญา (กลุ่มเพื่อน 9 ท่าน)',
    authorPhone: '081-999-8877',
    authorLine: 'https://line.me',
    pin: '1234',
    detail: 'เดินทาง 9 คน กระเป๋าคนละใบ จุดเริ่มสนามบินเชียงใหม่ แวะคาเฟ่ ปาย ถนนคนเดิน ปางอุ๋ง ขอคนขับใจเย็น ชำนาญโค้งทางเขา',
    postedAt: '10 นาทีที่แล้ว',
  },
];
