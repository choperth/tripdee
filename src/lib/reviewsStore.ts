/**
 * TripDee Reviews Store & Utilities
 *
 * Reviews live in the database (`reviews` table, migration 07). Nothing here
 * fabricates: a vehicle with no reviews returns an empty list and renders an
 * empty state. Previously this file invented three named, "verified" reviews
 * for every vehicle that had none.
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
  /**
   * True only when the reviewer has a completed booking for this vehicle.
   * Set by the server, never by the client.
   */
  verifiedTrip?: boolean;
  createdAt: string; // ISO string
}

export type NewReviewInput = Omit<Review, 'id' | 'createdAt' | 'verifiedTrip'> & {
  /**
   * Optional phone used server-side to check for a completed booking so the
   * "verified passenger" badge can be earned. Never rendered publicly.
   */
  authorPhone?: string;
};

export interface ReviewStats {
  averageRating: number | null;
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

/** Load reviews for a vehicle from the API. */
export async function fetchVehicleReviews(vehicleId: string): Promise<Review[]> {
  try {
    const res = await fetch(`/api/reviews?vehicleId=${encodeURIComponent(vehicleId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.reviews) ? data.reviews : [];
  } catch (err) {
    console.warn('[TripDee] Failed to load reviews:', err);
    return [];
  }
}

/**
 * Submit a review. `verifiedTrip` is decided server-side against completed
 * bookings, so the caller does not send it.
 */
export async function submitVehicleReview(
  input: NewReviewInput
): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่' };
    }
    return { success: true, review: data.review };
  } catch (err) {
    console.warn('[TripDee] Failed to submit review:', err);
    return { success: false, error: 'ไม่สามารถส่งรีวิวได้ กรุณาตรวจสอบการเชื่อมต่อ' };
  }
}

/**
 * Aggregate real reviews. With none, `averageRating` is null rather than a
 * plausible-looking number, so the UI can show an honest empty state.
 */
export function calculateReviewStats(reviews: Review[]): ReviewStats {
  const empty: ReviewStats = {
    averageRating: null,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentage5: 0,
    topTags: [],
  };
  if (!reviews || reviews.length === 0) return empty;

  const totalReviews = reviews.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  const tagCounts: Record<string, number> = {};

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] += 1;
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

  return { averageRating, totalReviews, breakdown, percentage5, topTags };
}
