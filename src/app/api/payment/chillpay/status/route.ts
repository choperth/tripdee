import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing bookingId query parameter' },
        { status: 400 }
      );
    }

    const booking = await getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Security (CWE-200 / PDPA): Only expose necessary payment polling status, never return raw customer phone or full PII
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentStatus: booking.paymentStatus,
      isPaid: booking.paymentStatus === 'paid',
      isContactUnlocked: booking.isContactUnlocked,
      paidAt: booking.paidAt || null,
      chillpayTransactionId: booking.chillpayTransactionId || null,
      depositAmount: booking.depositAmount,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Payment ChillPay Status Error]:', errMsg);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while checking payment status', details: errMsg },
      { status: 500 }
    );
  }
}
