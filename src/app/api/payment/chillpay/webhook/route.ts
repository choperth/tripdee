export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { updateBookingPayment, getBookingById } from '@/lib/supabase/service';
import { verifyChillPayWebhookChecksum, getChillPayConfig, ChillPayWebhookPayload } from '@/lib/chillpay';
import { sendLineBoardJobNotification } from '@/lib/lineNotification';
import { sendTelegramMessage, escapeTg } from '@/lib/notification';

export async function POST(req: NextRequest) {
  try {
    let payload: ChillPayWebhookPayload = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const obj: Record<string, unknown> = {};
      formData.forEach((val, key) => {
        obj[key] = val;
      });
      payload = obj as ChillPayWebhookPayload;
    } else {
      // Fallback parse text
      const raw = await req.text();
      try {
        payload = JSON.parse(raw);
      } catch {
        const params = new URLSearchParams(raw);
        const obj: Record<string, unknown> = {};
        params.forEach((val, key) => {
          obj[key] = val;
        });
        payload = obj as ChillPayWebhookPayload;
      }
    }

    const orderNo = String(payload.OrderNo || payload.orderNo || '');
    const transactionId = String(payload.TransactionId || payload.transactionId || '');
    const code = Number(payload.Code ?? payload.code ?? 0);
    const status = Number(payload.Status ?? payload.status ?? 0);

    if (!orderNo) {
      return NextResponse.json({ status: 400, message: 'Missing OrderNo' }, { status: 400 });
    }

    // 1. Verify Checksum & Secret Presence
    const config = getChillPayConfig();
    if (!config.md5Secret) {
      console.error('[ChillPay Webhook]: CHILLPAY_MD5_SECRET is not configured on this server');
      return NextResponse.json({ status: 500, message: 'Webhook secret is not configured' }, { status: 500 });
    }

    const isChecksumValid = verifyChillPayWebhookChecksum(payload, config.md5Secret);
    if (!isChecksumValid) {
      console.warn('[ChillPay Webhook]: Checksum verification failed for OrderNo:', orderNo);
      return NextResponse.json({ status: 403, message: 'Invalid CheckSum' }, { status: 403 });
    }

    // 2. Check if payment succeeded: Code 200 / Status 0 in ChillPay represents success
    const isSuccess = (code === 200 || status === 0) && (code !== 400 && code !== 500);

    const booking = await getBookingById(orderNo);
    if (!booking) {
      console.warn('[ChillPay Webhook]: Booking not found for OrderNo:', orderNo);
      return NextResponse.json({ status: 404, message: 'Booking not found' }, { status: 404 });
    }

    // 2.3 Verify paid amount matches expected deposit in database
    // ChillPay Amount can be in THB or satang depending on route/gateway
    const rawPaidAmount = Number(payload.Amount ?? payload.OrderAmount ?? 0);
    const expectedDeposit = Number(booking.depositAmount || 0);
    // Allow satang matching (e.g. 100 THB == 10000 satang) or direct THB matching
    const isAmountMatching =
      rawPaidAmount === expectedDeposit || rawPaidAmount === expectedDeposit * 100;

    if (!isAmountMatching && rawPaidAmount > 0) {
      console.warn(
        `[ChillPay Webhook]: Paid amount mismatch for OrderNo ${orderNo}. Received: ${rawPaidAmount}, Expected: ${expectedDeposit}`
      );
      return NextResponse.json(
        { status: 400, message: 'Paid amount does not match booking deposit' },
        { status: 400 }
      );
    }
    if (isSuccess) {
      // 3. Update database: payment_status = 'paid', is_contact_unlocked = true
      await updateBookingPayment(orderNo, {
        paymentStatus: 'paid',
        chillpayTransactionId: transactionId || null,
        isContactUnlocked: true,
        paidAt: new Date().toISOString(),
      });

      // 4. Send LINE Dispatcher Notification to driver channel / LINE Notify group
      try {
        await sendLineBoardJobNotification({
          id: orderNo,
          type: 'request',
          title: `✅ ล็อกคิวสำเร็จ: มัดจำ ${booking.depositAmount} บ. (${booking.route})`,
          date: booking.travelDate,
          days: booking.totalDays,
          seats: 10,
          price: booking.totalPrice,
          priceNote: `มัดจำแล้ว ฿${booking.depositAmount.toLocaleString()} | เหลือจ่ายคนขับ ฿${booking.remainingAmount.toLocaleString()}`,
          authorName: booking.customerName,
          authorPhone: booking.customerPhone,
          authorLine: booking.customerLine || undefined,
          detail: `ลูกค้าชำระเงินมัดจำผ่าน ChillPay PromptPay เรียบร้อยแล้ว ยืนยันการล็อกคิวรถ!`,
          category: 'general',
          isNegotiable: false,
        });
      } catch (lineErr) {
        console.error('[ChillPay Webhook LINE Dispatch Exception]:', lineErr);
      }

      // 5. Send Telegram Notification
      sendTelegramMessage(
        `💳 *[TripDee: ชำระมัดจำล็อกคิวสำเร็จ]*\n\n` +
        `🆔 *Order No:* \`${escapeTg(orderNo)}\`\n` +
        `💰 *ยอดมัดจำ:* ฿${booking.depositAmount.toLocaleString()} บาท\n` +
        `💵 *คงเหลือจ่ายคนขับ:* ฿${booking.remainingAmount.toLocaleString()} บาท\n` +
        `👤 *ลูกค้า:* ${escapeTg(booking.customerName)}\n` +
        `📞 *โทร:* [${booking.customerPhone}](tel:${booking.customerPhone})\n` +
        `📅 *วันเดินทาง:* ${escapeTg(booking.travelDate)} (${booking.totalDays} วัน)\n` +
        `📍 *เส้นทาง:* ${escapeTg(booking.route)}\n` +
        `🎉 ปลดล็อกเบอร์โทรและยืนยันคิวเรียบร้อยแล้ว`
      ).catch((err) => console.error('[Notification Payment Telegram Error]:', err));

      console.info(`[ChillPay Webhook SUCCESS]: Order ${orderNo} marked as paid`);
      return NextResponse.json({ status: 200, message: 'Success' }, { status: 200 });
    } else {
      // Payment failed or expired
      await updateBookingPayment(orderNo, {
        paymentStatus: 'failed',
        chillpayTransactionId: transactionId || null,
        isContactUnlocked: false,
      });

      console.warn(`[ChillPay Webhook FAILED]: Order ${orderNo} marked as failed`);
      return NextResponse.json({ status: 200, message: 'Marked failed' }, { status: 200 });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[ChillPay Webhook Error]:', errMsg);
    return NextResponse.json({ status: 500, message: 'Internal Server Error', error: errMsg }, { status: 500 });
  }
}
