import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { validateHoneypot } from '@/lib/honeypot';
import { Review } from '@/lib/reviewsStore';
import { POPULAR_REVIEW_TAGS } from '@/lib/reviewsStore';

type ReviewRow = {
  id: string;
  vehicle_id: string;
  author_name: string;
  rating: number;
  travel_date: string | null;
  trip_route: string | null;
  comment: string;
  tags: string[] | null;
  driver_reply: string | null;
  driver_reply_date: string | null;
  verified_trip: boolean | null;
  created_at: string;
};

function mapRow(row: ReviewRow): Review {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    authorName: row.author_name,
    rating: Number(row.rating),
    travelDate: row.travel_date || '',
    tripRoute: row.trip_route || undefined,
    comment: row.comment,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    driverReply: row.driver_reply
      ? {
          date: row.driver_reply_date || '',
          comment: row.driver_reply,
        }
      : undefined,
    verifiedTrip: Boolean(row.verified_trip),
    createdAt: row.created_at,
  };
}

/**
 * A review counts as verified only when the author has a paid booking for this
 * vehicle whose payment has been settled. The client cannot assert this.
 */
async function hasCompletedBooking(vehicleId: string, phone: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !phone) return false;
  try {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 9) return false;
    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer_phone, payment_status')
      .eq('vehicle_id', vehicleId)
      .eq('payment_status', 'paid')
      .limit(5);
    if (error || !data) return false;
    return data.some(
      (b: { customer_phone?: string }) =>
        (b.customer_phone || '').replace(/\D/g, '') === clean
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: true, total: 0, reviews: [] });
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      // Migration 07 not applied yet.
      return NextResponse.json({ success: true, total: 0, reviews: [] });
    }

    const reviews = (data as unknown as ReviewRow[]).map(mapRow);
    return NextResponse.json({ success: true, total: reviews.length, reviews });
  } catch (err) {
    console.warn('[TripDee Reviews] Error fetching reviews:', err);
    return NextResponse.json({ success: true, total: 0, reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const hp = validateHoneypot(body);
  if (hp.isSpam) {
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกรีวิวได้ กรุณาลองใหม่' },
      { status: 400 }
    );
  }

  const vehicleId = String(body.vehicleId || '').trim();
  const authorName = String(body.authorName || '').trim();
  const comment = String(body.comment || '').trim();
  const rating = Number(body.rating);
  const authorPhone = String(body.authorPhone || '').trim();

  if (!vehicleId || !authorName || !comment) {
    return NextResponse.json(
      { error: 'กรุณากรอกชื่อผู้รีวิว คะแนน และความคิดเห็น' },
      { status: 400 }
    );
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'คะแนนต้องอยู่ระหว่าง 1 ถึง 5' }, { status: 400 });
  }
  if (comment.length > 2000) {
    return NextResponse.json({ error: 'ความคิดเห็นยาวเกินไป' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'ระบบรีวิวยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง' },
      { status: 503 }
    );
  }

  // Only accept tags the platform offers, so the tag cloud cannot be polluted.
  const allowedTags = new Set<string>(POPULAR_REVIEW_TAGS);
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t: unknown): t is string => typeof t === 'string' && allowedTags.has(t))
    : [];

  const verifiedTrip = await hasCompletedBooking(vehicleId, authorPhone);

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        vehicle_id: vehicleId,
        author_name: authorName,
        author_phone: authorPhone || null,
        rating: Math.round(rating),
        travel_date: body.travelDate ? String(body.travelDate) : null,
        trip_route: body.tripRoute ? String(body.tripRoute) : null,
        comment,
        tags,
        verified_trip: verifiedTrip,
      })
      .select()
      .single();

    if (error) {
      console.warn('[TripDee Reviews] Error inserting review:', error.message);
      return NextResponse.json(
        { error: 'ไม่สามารถบันทึกรีวิวได้ กรุณาลองใหม่' },
        { status: 500 }
      );
    }

    // Keep the vehicle's cached score in step with the real reviews.
    try {
      await supabase.rpc('refresh_vehicle_rating', { target_vehicle_id: vehicleId });
    } catch {
      // Non-fatal: the review is stored, the cache just lags.
    }

    return NextResponse.json({ success: true, review: mapRow(data as unknown as ReviewRow) });
  } catch (err) {
    console.warn('[TripDee Reviews] Exception saving review:', err);
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกรีวิวได้ กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}
