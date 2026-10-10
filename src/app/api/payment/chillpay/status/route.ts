export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBookingPayment } from '@/lib/supabase/service';
import { inquireChillPayTransaction } from '@/lib/chillpay';
import { sendBookingSuccessNotifications } from '@/lib/notification';
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId || !/^[A-Za-z0-9_-]{5,64}$/.test(bookingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing bookingId query parameter' },
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
    // If pending for more than 15 seconds, trigger inquiry fallback directly with ChillPay gateway
    if (booking.paymentStatus === 'pending') {
      const createdAtMs = new Date(booking.createdAt).getTime();
      const elapsedSec = (Date.now() - createdAtMs) / 1000;

      if (elapsedSec >= 15) {
        try {
          const inquiryRes = await inquireChillPayTransaction({
            orderNo: booking.id,
            transactionId: booking.chillpayTransactionId || undefined,
          });

          if (inquiryRes.isPaid) {
            console.info(`[ChillPay Status Inquiry Fallback]: Payment confirmed for ${booking.id} directly from gateway!`);
            const paidAt = new Date().toISOString();
            const updatedBooking = await updateBookingPayment(booking.id, {
              paymentStatus: 'paid',
              chillpayTransactionId: inquiryRes.transactionId || booking.chillpayTransactionId,
              isContactUnlocked: true,
              paidAt,
            });

            if (updatedBooking) {
              sendBookingSuccessNotifications(updatedBooking).catch((e) =>
                console.error('[Inquiry Fallback Notification Error]:', e)
              );
            }

            return NextResponse.json({
              success: true,
              bookingId: booking.id,
              paymentStatus: 'paid',
              isPaid: true,
              isContactUnlocked: true,
              paidAt,
              chillpayTransactionId: inquiryRes.transactionId || booking.chillpayTransactionId || null,
              depositAmount: booking.depositAmount,
            });
          }
        } catch (inquiryErr) {
          console.warn('[ChillPay Status Inquiry Warning]:', inquiryErr);
        }
      }
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
