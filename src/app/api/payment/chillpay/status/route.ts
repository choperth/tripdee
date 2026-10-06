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

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentStatus: booking.paymentStatus,
      isPaid: booking.paymentStatus === 'paid',
      isContactUnlocked: booking.isContactUnlocked,
      paidAt: booking.paidAt || null,
      chillpayTransactionId: booking.chillpayTransactionId || null,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      route: booking.route,
      travelDate: booking.travelDate,
      totalPrice: booking.totalPrice,
      depositAmount: booking.depositAmount,
      remainingAmount: booking.remainingAmount,
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
