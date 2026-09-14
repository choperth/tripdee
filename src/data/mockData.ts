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
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  images: string[];
  /** อัตราค่าเช่าพร้อมคนขับต่อวัน แยกตามโซนปลายทาง */
  zoneRates: Record<ZoneId, number>;
  /** หมายเหตุราคาเฉพาะคัน (ถ้ามี) */
  rateNote?: string;
  location: string;
  popularRoutes: string[];
  amenities: string[];
  description: string;
}

export interface Sponsor {
  id: string;
  title: string;
  category: 'hotel' | 'auto_service' | 'restaurant' | 'activity';
  categoryLabel: string;
  tagline: string;
  badgeText: string;
  image: string;
  link: string;
  discountText: string;
  location: string;
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
    label: 'ในเมือง / รอบเมือง / สนามบิน',
    shortLabel: 'ในเมือง',
    examples: 'ตัวเมือง นิมมาน สนามบิน ดอยสุเทพ',
    baseRateRange: [1800, 2000],
    fuelFlatRatePerDay: 500,
  },
  {
    id: 'midHill',
    zoneNo: 2,
    label: 'ดอยระดับกลาง',
    shortLabel: 'ม่อนแจ่ม',
    examples: 'ม่อนแจ่ม แม่ริม แม่กำปอง',
    baseRateRange: [2000, 2200],
    fuelFlatRatePerDay: 700,
  },
  {
    id: 'highHill',
    zoneNo: 3,
    label: 'ดอยสูงชันพิเศษ',
    shortLabel: 'อินทนนท์',
    examples: 'ดอยอินทนนท์ กิ่วแม่ปาน ดอยอ่างขาง',
    baseRateRange: [2200, 2500],
    fuelFlatRatePerDay: 900,
  },
  {
    id: 'crossProvince',
    zoneNo: 4,
    label: 'ข้ามจังหวัด',
    shortLabel: 'ข้ามจังหวัด',
    examples: 'เชียงราย ปาย แม่ฮ่องสอน',
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
    name: 'ม่อนแจ่ม - แม่ริม',
    filterKey: 'ม่อนแจ่ม',
    zone: 'ภูเขา/ธรรมชาติ',
    highlight: 'ทุ่งดอกไม้ สวนส้ม ทะเลหมอก คาเฟ่วิวเขา',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '1,800 - 2,200 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP / SUV'
  },
  {
    id: 'inthanon',
    name: 'ดอยอินทนนท์ - กิ่วแม่ปาน',
    filterKey: 'ดอยอินทนนท์',
    zone: 'ภูเขา/ขึ้นดอยสูง',
    highlight: 'จุดสูงสุดแดนสยาม พระมหาธาตุฯ น้ำตกวชิรธาร เส้นทางศึกษาธรรมชาติ',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,200 - 2,500 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP เครื่องแรงชำนาญทาง'
  },
  {
    id: 'mae-kampong',
    name: 'แม่กำปอง - สันกำแพง',
    filterKey: 'แม่กำปอง',
    zone: 'วิถีชุมชน/ธรรมชาติ',
    highlight: 'หมู่บ้านในหุบเขา คาเฟ่ริมธาร น้ำตกแม่กำปอง น้ำพุร้อนสันกำแพง',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '1,800 - 2,200 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP / เก๋งขับเอง'
  },
  {
    id: 'chiang-rai',
    name: 'ทริปข้ามจังหวัด เชียงใหม่ - เชียงราย',
    filterKey: 'ทริปข้ามจังหวัด เชียงใหม่',
    zone: 'ทริปวันเดย์/ค้างคืน',
    highlight: 'วัดร่องขุ่น ไร่ชาฉุยฟง วัดร่องเสือเต้น ดอยช้าง',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
    estimatedPrice: '2,500 - 3,000 บ./วัน',
    recommendedVehicle: 'รถตู้ VIP เบาะนวด'
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
    discountText: 'ลดทันที 15% เมื่อแสดงใบยืนยันรถเช่า TripDee',
    location: 'ม่อนแจ่ม, เชียงใหม่'
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
    location: 'ถนนซุปเปอร์ไฮเวย์ เชียงใหม่'
  }
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
    rating: 4.9,
    reviewCount: 48,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
    location: 'ตัวเมืองเชียงใหม่ / สนามบิน / นิมมาน',
    popularRoutes: ['ม่อนแจ่ม', 'ดอยอินทนนท์', 'แม่กำปอง', 'เชียงราย'],
    amenities: [
      'เบาะนวดปรับไฟฟ้า 9 ที่นั่ง',
      'ชุดคาราโอเกะ + YouTube Smart TV',
      'WiFi ความเร็วสูงบนรถ',
      'ที่ชาร์จ Type-C / USB ทุกที่นั่ง',
      'ประกันภัยผู้โดยสารชั้น 1',
      'ตู้เย็นขนาดเล็กบนรถ'
    ],
    description: 'รถตู้ตกแต่ง VIP สภาพใหม่เอี่ยม แอร์เย็นฉ่ำ เบาะนวดสบาย เหมาะสำหรับทริปครอบครัว ผู้บริหาร และกลุ่มเพื่อน คนขับชำนาญเส้นทางดอยสูง ปลอดภัย ขับนุ่มนวล ไม่สูบบุหรี่'
  },
  {
    id: 'v-2',
    title: 'All New Commuter หลังคาสูง 10 ที่นั่ง VIP สไตล์โมเดิร์น',
    type: 'van',
    seats: 10,
    driverName: 'นายกิตติศักดิ์ ศรีล้านนา',
    driverNickname: 'พี่เอก เชียงใหม่ทราเวล',
    driverPhone: '089-876-5432',
    driverLine: 'https://line.me',
    rating: 4.8,
    reviewCount: 35,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1800, midHill: 2000, highHill: 2200, crossProvince: 2600 },
    location: 'สนามบินเชียงใหม่ / สันทราย / แม่ริม',
    popularRoutes: ['ดอยสุเทพ', 'ม่อนแจ่ม', 'ปาย-แม่ฮ่องสอน'],
    amenities: [
      'เบาะ VIP 10 ที่นั่ง กว้างขวาง',
      'จอเพดาน Android TV',
      'ไฟ Ambient Light ปรับสีได้',
      'ช่องชาร์จโทรศัพท์ทุกแถว',
      'ประกันภัย พ.ร.บ. ครบถ้วน'
    ],
    description: 'รถตู้รุ่นใหม่ สภาพป้ายแดง เบาะหนังแท้นุ่มสบาย ระบบช่วงล่างนุ่มนวลขึ้นดอยได้ปลอดภัย คนขับตรงต่อเวลา มีใบขับขี่สาธารณะถูกต้อง รับงานสัมมนาและทัวร์ส่วนตัว'
  },
  {
    id: 'v-3',
    title: 'Toyota Majesty คลาสผู้บริหาร 7 ที่นั่ง เบาะ Captain Seat พรีเมียม',
    type: 'van',
    seats: 7,
    driverName: 'นายวรพจน์ กานต์ธนา',
    driverNickname: 'พี่พจน์ VIP Limo',
    driverPhone: '086-555-1234',
    driverLine: 'https://line.me',
    rating: 5.0,
    reviewCount: 29,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 3200, midHill: 3400, highHill: 3600, crossProvince: 4000 },
    rateNote: 'รุ่นพรีเมียมผู้บริหาร ออกใบกำกับภาษีเต็มรูปได้',
    location: 'สนามบินเชียงใหม่ / โรงแรม 5 ดาวทั่วเชียงใหม่',
    popularRoutes: ['รับ-ส่งสนามบิน', 'ประชุมสัมมนาผู้บริหาร', 'ทริปตีกอล์ฟ'],
    amenities: [
      'เบาะ Captain Seat ปรับไฟฟ้าคู่หน้า',
      'ประตูสไลด์ไฟฟ้าสองฝั่ง',
      'ระบบฟอกอากาศ Nanoe',
      'คนขับสวมสูทสุภาพ ตรงเวลา 100%',
      'รองรับการออกใบกำกับภาษีเต็มรูปแบบ'
    ],
    description: 'ระดับพรีเมียมสำหรับรับรองแขก VIP ลูกค้าองค์กร หรือทริปครอบครัวที่ต้องการความหรูหราและความเป็นส่วนตัวสูงสุด ออกใบกำกับภาษีในนามบริษัทได้'
  },
  {
    id: 'v-4',
    title: 'Toyota Fortuner 4WD 7 ที่นั่ง (เช่าขับเอง หรือพร้อมคนขับ)',
    type: 'suv',
    seats: 7,
    driverName: 'ซีเอ็นเอ็กซ์ คาร์เร้นท์',
    driverNickname: 'ทีมงานเช่ารถเชียงใหม่',
    driverPhone: '053-112233',
    driverLine: 'https://line.me',
    rating: 4.7,
    reviewCount: 62,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    zoneRates: { city: 1600, midHill: 1800, highHill: 2000, crossProvince: 2400 },
    rateNote: 'เช่าขับเองเริ่ม ฿1,600/วัน (มัดจำ 5,000 บ. คืนทันที)',
    location: 'จุดส่งรถฟรี สนามบินเชียงใหม่',
    popularRoutes: ['ขับขึ้นดอยอินทนนท์', 'เชียงดาว', 'อ่างขาง'],
    amenities: [
      'ระบบขับเคลื่อน 4 ล้อ ลุยดอยสบาย',
      'Apple CarPlay / Android Auto',
      'กล้องมองหลังและเซ็นเซอร์รอบคัน',
      'ประกันภัยชั้น 1 พาณิชย์',
      'ส่งและรับรถฟรีที่สนามบิน'
    ],
    description: 'SUV สภาพใหม่กริ๊บ เหมาะสำหรับกลุ่มเพื่อนหรือครอบครัว 4-6 คนที่อยากขับรถเที่ยวเอง ขึ้นดอยสูงได้มั่นใจ ช่วงล่างแน่น เอกสารเช่าง่าย ไม่ใช้บัตรเครดิตก็เช่าได้'
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
