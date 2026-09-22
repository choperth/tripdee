/**
 * TripDee Reviews Store & Utilities
 * Provides data modeling, curated mock reviews for drivers, and localStorage persistence for user-submitted reviews.
 */

import { Vehicle } from '@/data/mockData';

export interface Review {
  id: string;
  vehicleId: string;
  authorName: string;
  rating: number; // 1 - 5
  travelDate: string; // e.g. "กุมภาพันธ์ 2026", "15 ม.ค. 2026"
  tripRoute?: string;
  comment: string;
  tags?: string[];
  driverReply?: {
    date: string;
    comment: string;
  };
  verifiedTrip?: boolean;
  createdAt: string; // ISO string
}

export type NewReviewInput = Omit<Review, 'id' | 'createdAt'>;

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentage5: number;
  topTags: { tag: string; count: number }[];
}

export const POPULAR_REVIEW_TAGS = [
  'ขับนิ่ม ปลอดภัย',
  'ตรงต่อเวลา',
  'รถสะอาด แอร์เย็น',
  'ชำนาญทางดอย/โค้ง',
  'สุภาพ บริการดี',
  'แนะนำร้านอร่อย/จุดถ่ายรูป',
  'ใจเย็น เป็นกันเอง',
  'คาราโอเกะ/เครื่องเสียงดี',
  'เบาะนวดนั่งสบาย',
  'ช่วยยกกระเป๋าดูแลผู้สูงอายุ',
] as const;

export type ReviewTag = (typeof POPULAR_REVIEW_TAGS)[number];

const STORAGE_KEY = 'td-vehicle-reviews-v1';

/** Curated reviews for notable vehicles to deliver rich initial experience */
const CURATED_REVIEWS: Record<string, Review[]> = {
  v1: [
    {
      id: 'rev-v1-1',
      vehicleId: 'v1',
      authorName: 'คุณธนวัฒน์ ศิริพงษ์',
      rating: 5,
      travelDate: 'กุมภาพันธ์ 2026',
      tripRoute: 'เชียงใหม่ - ดอยอินทนนท์ - แม่แจ่ม 3 วัน 2 คืน',
      comment:
        'พี่สมศักดิ์ขับดีมาก นิ่ม ปลอดภัยตลอดเส้นทางขึ้นดอยอินทนนท์ ครอบครัวมีผู้สูงอายุไปด้วย นั่งสบายไม่เวียนหัวเลย แอร์เย็นฉ่ำ รถสะอาดมาก มีน้ำดื่มเตรียมไว้ให้ด้วย ประทับใจมากครับ ทริปหน้าใช้บริการอีกแน่นอน',
      tags: ['ขับนิ่ม ปลอดภัย', 'ชำนาญทางดอย/โค้ง', 'รถสะอาด แอร์เย็น', 'ช่วยยกกระเป๋าดูแลผู้สูงอายุ'],
      verifiedTrip: true,
      createdAt: '2026-02-18T10:30:00Z',
      driverReply: {
        date: '2026-02-19',
        comment: 'ขอบพระคุณคุณธนวัฒน์และครอบครัวมากครับ ยินดีให้บริการเสมอครับผม โอกาสหน้ายินดีต้อนรับครับ',
      },
    },
    {
      id: 'rev-v1-2',
      vehicleId: 'v1',
      authorName: 'คุณปาริฉัตร มั่นคง',
      rating: 5,
      travelDate: 'มกราคม 2026',
      tripRoute: 'สนามบินเชียงใหม่ - ม่อนแจ่ม - ตัวเมือง',
      comment:
        'ตรงเวลามาก มารอที่สนามบินก่อนเวลาเกือบครึ่งชั่วโมง สุภาพ อัธยาศัยดี แนะนำร้านอาหารพื้นเมืองอร่อยและไม่แพง พาแวะถ่ายรูปจุดชมวิวม่อนแจ่มสวยๆ เพลงในรถเพราะ เบาะนวดไฟฟ้าสบายสุดๆ เลยค่ะ',
      tags: ['ตรงต่อเวลา', 'สุภาพ บริการดี', 'แนะนำร้านอร่อย/จุดถ่ายรูป', 'เบาะนวดนั่งสบาย'],
      verifiedTrip: true,
      createdAt: '2026-01-25T14:15:00Z',
    },
    {
      id: 'rev-v1-3',
      vehicleId: 'v1',
      authorName: 'คุณวิศรุต (ทริปบริษัท)',
      rating: 5,
      travelDate: 'มกราคม 2026',
      tripRoute: 'ทริปไหว้พระ 9 วัด เชียงใหม่ - ลำพูน',
      comment:
        'รถ VIP สวยหรูตรงปกตามรูปเลยครับ เครื่องเสียงดี คาราโอเกะอัปเดตเพลงใหม่หมด เพื่อนๆ ในแก๊งสนุกกันมาก แอร์เย็นทั้งคัน คนขับใจเย็นขับนิ่มมาก ออกบิลเบิกบริษัทได้ครบถ้วน',
      tags: ['รถสะอาด แอร์เย็น', 'คาราโอเกะ/เครื่องเสียงดี', 'สุภาพ บริการดี', 'ใจเย็น เป็นกันเอง'],
      verifiedTrip: true,
      createdAt: '2026-01-10T18:00:00Z',
      driverReply: {
        date: '2026-01-11',
        comment: 'ขอบคุณคณะคุณวิศรุตมากครับ ดีใจที่ทุกท่านสนุกสนานกับคาราโอเกะและเดินทางปลอดภัยครับ',
      },
    },
  ],
  v2: [
    {
      id: 'rev-v2-1',
      vehicleId: 'v2',
      authorName: 'คุณกิตติศักดิ์ พรหมมินทร์',
      rating: 5,
      travelDate: 'กุมภาพันธ์ 2026',
      tripRoute: 'เชียงใหม่ - เชียงราย - วัดร่องขุ่น - สามเหลี่ยมทองคำ',
      comment:
        'พี่วันชัยชำนาญเส้นทางเชียงรายมาก ข้ามเขาเวียนหัวน้อยมากเพราะขับเนียน ไม่เหยียบเบรกกระชาก แนะนำจุดแวะพักเข้าห้องน้ำสะอาดๆ ตลอดทาง รถกว้างขวางนั่ง 9 คนไม่อึดอัดเลย',
      tags: ['ขับนิ่ม ปลอดภัย', 'ชำนาญทางดอย/โค้ง', 'สุภาพ บริการดี'],
      verifiedTrip: true,
      createdAt: '2026-02-12T09:00:00Z',
    },
    {
      id: 'rev-v2-2',
      vehicleId: 'v2',
      authorName: 'คุณสุชาดา & เพื่อนๆ',
      rating: 5,
      travelDate: 'มกราคม 2026',
      tripRoute: 'เชียงใหม่ - แม่กำปอง - น้ำพุร้อนสันกำแพง',
      comment:
        'ขับขึ้นแม่กำปองทางแคบและชันได้อย่างมืออาชีพมาก ปลอดภัยไร้กังวล คนขับใจดี ช่วยถ่ายรูปให้ทั้งกลุ่มสวยมากค่ะ ประทับใจมาก',
      tags: ['ชำนาญทางดอย/โค้ง', 'ใจเย็น เป็นกันเอง', 'แนะนำร้านอร่อย/จุดถ่ายรูป'],
      verifiedTrip: true,
      createdAt: '2026-01-28T16:20:00Z',
    },
  ],
  v3: [
    {
      id: 'rev-v3-1',
      vehicleId: 'v3',
      authorName: 'Dr. Michael Chen & Family',
      rating: 5,
      travelDate: 'February 2026',
      tripRoute: 'Bangkok Airport - Pattaya - Hua Hin 5 Days',
      comment:
        'Excellent luxury Alphard experience! Driver was very punctual, polite, and drove smoothly. English communication was clear and helpful. Highly recommended for executive family travel.',
      tags: ['ตรงต่อเวลา', 'สุภาพ บริการดี', 'ขับนิ่ม ปลอดภัย', 'รถสะอาด แอร์เย็น'],
      verifiedTrip: true,
      createdAt: '2026-02-05T11:45:00Z',
      driverReply: {
        date: '2026-02-06',
        comment: 'Thank you very much Dr. Chen. It was an absolute pleasure hosting you and your family!',
      },
    },
    {
      id: 'rev-v3-2',
      vehicleId: 'v3',
      authorName: 'คุณนภัสสร อัครเดช',
      rating: 5,
      travelDate: 'มกราคม 2026',
      tripRoute: 'รับรองลูกค้าต่างชาติ กรุงเทพฯ - นิคมอุตสาหกรรมชลบุรี',
      comment:
        'รถ Alphard สะอาดไร้กลิ่นอับ สภาพใหม่เอี่ยม เบาะไฟฟ้าผู้บริหารนุ่มสบาย ลูกค้า VIP จากญี่ปุ่นชมไม่ขาดสาย คนขับแต่งกายสุภาพเรียบร้อย มีความเป็นมืออาชีพสูงมาก',
      tags: ['รถสะอาด แอร์เย็น', 'สุภาพ บริการดี', 'ตรงต่อเวลา'],
      verifiedTrip: true,
      createdAt: '2026-01-19T17:30:00Z',
    },
  ],
  v4: [
    {
      id: 'rev-v4-1',
      vehicleId: 'v4',
      authorName: 'คุณอนันต์ ชัยเจริญ',
      rating: 5,
      travelDate: 'กุมภาพันธ์ 2026',
      tripRoute: 'สนามบินภูเก็ต - พังงา - แสมสาร - ป่าตอง',
      comment:
        'พี่ชาญชัยคนพื้นที่ภูเก็ตแท้ๆ รู้จักเส้นทางลัดเลี่ยงรถติดเป็นอย่างดี รถ Majesty นั่งสบายระดับ First Class เบาะกว้างขวาง แอร์เย็นฉ่ำทั้งคัน',
      tags: ['ขับนิ่ม ปลอดภัย', 'แนะนำร้านอร่อย/จุดถ่ายรูป', 'สุภาพ บริการดี'],
      verifiedTrip: true,
      createdAt: '2026-02-14T08:20:00Z',
    },
  ],
};

/**
 * Generate contextual realistic reviews when a vehicle does not have specific curated ones,
 * keeping the platform vibrant, trustworthy, and realistic.
 */
function generateFallbackReviews(vehicle: Vehicle): Review[] {
  const rawName = vehicle.driverNickname || vehicle.driverName || 'คนขับ';
  const driverDisplayName =
    rawName.startsWith('พี่') ||
    rawName.startsWith('โก') ||
    rawName.startsWith('น้า') ||
    rawName.startsWith('ลุง')
      ? rawName
      : `พี่${rawName}`;
  const location = vehicle.location?.split('/')[0]?.trim() || 'เชียงใหม่';
  const primaryRoute = vehicle.popularRoutes?.[0] || 'สถานที่ท่องเที่ยวสำคัญ';
  const secondaryRoute = vehicle.popularRoutes?.[1] || 'เส้นทางชมวิวรอบเมือง';

  return [
    {
      id: `fallback-${vehicle.id}-1`,
      vehicleId: vehicle.id,
      authorName: 'คุณธวัชชัย วงศ์วานิช',
      rating: 5,
      travelDate: 'กุมภาพันธ์ 2026',
      tripRoute: `ทริป ${location} - ${primaryRoute}`,
      comment: `${driverDisplayName} บริการดีเยี่ยม สุภาพและตรงเวลามาก ขับรถนิ่มปลอดภัย ผู้โดยสารทุกคนในคณะชมเป็นเสียงเดียวกัน รถสะอาด แอร์เย็นฉ่ำตลอดการเดินทาง`,
      tags: ['ขับนิ่ม ปลอดภัย', 'ตรงต่อเวลา', 'รถสะอาด แอร์เย็น', 'สุภาพ บริการดี'],
      verifiedTrip: true,
      createdAt: '2026-02-15T09:30:00Z',
      driverReply: {
        date: '2026-02-16',
        comment: `ขอบพระคุณมากครับ ยินดีที่ได้ร่วมทริปและดูแลคุณลูกค้าครับ หวังว่าจะได้ให้บริการอีกในทริปหน้าครับ`,
      },
    },
    {
      id: `fallback-${vehicle.id}-2`,
      vehicleId: vehicle.id,
      authorName: 'คุณณัฐมน เปรมสุข',
      rating: 5,
      travelDate: 'มกราคม 2026',
      tripRoute: `ทริปท่องเที่ยว ${secondaryRoute}`,
      comment: `ประทับใจมากค่ะ คนขับชำนาญเส้นทาง แนะนำร้านอาหารและมุมถ่ายรูปสวยๆ ให้ตลอดทาง รถตรงปกตามรูปทุกประการ แนะนำเลยค่ะสำหรับใครที่หาเช่ารถพร้อมคนขับ`,
      tags: ['แนะนำร้านอร่อย/จุดถ่ายรูป', 'ใจเย็น เป็นกันเอง', 'ชำนาญทางดอย/โค้ง'],
      verifiedTrip: true,
      createdAt: '2026-01-22T13:40:00Z',
    },
    {
      id: `fallback-${vehicle.id}-3`,
      vehicleId: vehicle.id,
      authorName: 'คุณศุภกร (ทริปสัมมนา)',
      rating: (vehicle.rating && vehicle.rating >= 4.9) ? 5 : 4,
      travelDate: 'ธันวาคม 2025',
      tripRoute: `รับส่งสนามบิน & นำเที่ยวในพื้นที่ ${location}`,
      comment: `ตรงเวลามาก จัดการสัมภาระให้เรียบร้อย ขับขี่ปลอดภัย มีใบเสร็จรับเงิน/เอกสารออกให้เรียบร้อย ราคายุติธรรมไม่มีบวกเพิ่มหน้างาน`,
      tags: ['ตรงต่อเวลา', 'ช่วยยกกระเป๋าดูแลผู้สูงอายุ', 'สุภาพ บริการดี'],
      verifiedTrip: true,
      createdAt: '2025-12-28T15:10:00Z',
    },
  ];
}

/** Get stored reviews from localStorage */
function getStoredReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load reviews from localStorage', err);
    return [];
  }
}

/** Save reviews list to localStorage */
function setStoredReviews(reviews: Review[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('Failed to persist reviews to localStorage', err);
  }
}

/**
 * Get all reviews for a specific vehicle (user-added + curated / fallbacks)
 */
export function getVehicleReviews(vehicleId: string, vehicle?: Vehicle): Review[] {
  const stored = getStoredReviews().filter((r) => r.vehicleId === vehicleId);

  // If curated reviews exist for this vehicle
  const curated = CURATED_REVIEWS[vehicleId] || [];

  let baseReviews = curated;
  if (baseReviews.length === 0 && vehicle) {
    baseReviews = generateFallbackReviews(vehicle);
  }

  // Deduplicate user-stored reviews with base reviews
  const existingIds = new Set(stored.map((r) => r.id));
  const merged = [
    ...stored,
    ...baseReviews.filter((r) => !existingIds.has(r.id)),
  ];

  // Sort newest first
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Add a new review for a vehicle
 */
export function addVehicleReview(input: NewReviewInput): Review {
  const newReview: Review = {
    ...input,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    verifiedTrip: true, // User who reviews on platform is marked as verified passenger
  };

  const stored = getStoredReviews();
  const updated = [newReview, ...stored];
  setStoredReviews(updated);

  // Dispatch event so active listeners can update without page reload
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('td:review-added', {
        detail: { vehicleId: input.vehicleId, review: newReview },
      })
    );
  }

  return newReview;
}

/**
 * Calculate review statistics from a list of reviews
 */
export function calculateReviewStats(reviews: Review[], fallbackRating = 4.9, fallbackCount = 48): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: fallbackRating,
      totalReviews: fallbackCount,
      breakdown: {
        5: Math.round(fallbackCount * 0.9),
        4: Math.round(fallbackCount * 0.08),
        3: Math.round(fallbackCount * 0.02),
        2: 0,
        1: 0,
      },
      percentage5: 90,
      topTags: POPULAR_REVIEW_TAGS.slice(0, 4).map((tag, idx) => ({
        tag,
        count: Math.max(5, fallbackCount - idx * 8),
      })),
    };
  }

  const totalReviews = reviews.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  const tagCounts: Record<string, number> = {};

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] = (breakdown[star] || 0) + 1;
    sumRating += r.rating;

    if (r.tags) {
      r.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const averageRating = Number((sumRating / totalReviews).toFixed(1));
  const percentage5 = Math.round((breakdown[5] / totalReviews) * 100);

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    averageRating,
    totalReviews,
    breakdown,
    percentage5,
    topTags,
  };
}
