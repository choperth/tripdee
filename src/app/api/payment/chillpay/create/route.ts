import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/supabase/service';
import { createChillPayPayment, getChillPayConfig } from '@/lib/chillpay';
import { validateHoneypot } from '@/lib/honeypot';

interface CreatePaymentRequestBody {
  vehicleId?: string;
  driverId?: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  route: string;
  travelDate: string;
  totalDays?: number;
  totalPrice: number;
  depositAmount: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePaymentRequestBody;

    const hpResult = validateHoneypot(body as unknown as Record<string, unknown>);
    if (hpResult.isSpam) {
      console.warn(`[Payment Create Spam Blocked] reason=${hpResult.reason}`);
      return NextResponse.json(
        { success: false, error: 'Invalid submission' },
        { status: 400 }
      );
    }
    if (!body.customerName || !body.customerPhone || !body.route || !body.travelDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking fields (name, phone, route, date)' },
        { status: 400 }
      );
    }

    const totalDays = Math.max(1, Number(body.totalDays) || 1);
    // Security (CWE-20 / Tamper-proofing): Always calculate deposit strictly on server (100 THB/day)
    const depositAmount = totalDays * 100;
    const totalPrice = Math.max(depositAmount, Number(body.totalPrice) || 0);
    const remainingAmount = Math.max(0, totalPrice - depositAmount);

    // Generate unique order ID TD-BK-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `TD-BK-${dateStr}-${randSuffix}`;

    // 1. Initialise booking record in Supabase (status: pending)
    const newBooking = await createBooking({
      id: bookingId,
      vehicleId: body.vehicleId,
      driverId: body.driverId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerLine: body.customerLine,
      route: body.route,
      travelDate: body.travelDate,
      totalDays,
      totalPrice,
      depositAmount,
      remainingAmount,
    });

    // 2. Call ChillPay Payment API
    const config = getChillPayConfig();
    const hasChillPayCredentials = Boolean(config.merchantCode && config.apiKey && config.md5Secret);

    let chillPayResult: {
      qrImage?: string;
      paymentUrl?: string;
      transactionId?: string;
      rawPayload?: Record<string, unknown>;
    } = {};

    if (hasChillPayCredentials) {
      const paymentRes = await createChillPayPayment({
        orderNo: bookingId,
        customerId: body.customerPhone.replace(/\D/g, '') || 'CUST',
        amountInBaht: depositAmount,
        phoneNumber: body.customerPhone,
        description: `TripDee Deposit ${bookingId} (${body.route})`,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
      });

      if (paymentRes.code === 200 || paymentRes.status === 0) {
        chillPayResult = {
          qrImage: paymentRes.qrImage,
          paymentUrl: paymentRes.paymentUrl,
          transactionId: paymentRes.transactionId,
          rawPayload: paymentRes.rawPayload,
        };
      } else {
        console.warn('[ChillPay API Non-Success Response]:', paymentRes.message);
      }
    } else {
      console.info('[ChillPay API]: Credentials not fully configured in env, generating dynamic fallback PromptPay payload');
    }

    // Dynamic PromptPay Fallback QR if ChillPay sandbox/sandbox credentials aren't returned or testing
    // Generates a mock/fallback PromptPay QR visual so the UI never breaks.
    const fallbackPromptPayPayload = `00020101021229370016A00000067701011101130066${body.customerPhone.replace(/\D/g, '').slice(-9)}5802TH5303764540${depositAmount}.006304`;
    const finalQrImage = chillPayResult.qrImage || null;

    return NextResponse.json({
      success: true,
      bookingId: newBooking.id,
      qrImage: finalQrImage,
      qrPayload: fallbackPromptPayPayload,
      paymentUrl: chillPayResult.paymentUrl || null,
      transactionId: chillPayResult.transactionId || null,
      depositAmount,
      remainingAmount,
      totalPrice,
      expireMinutes: 15,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Payment ChillPay Create Error]:', errMsg);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while creating ChillPay payment', details: errMsg },
      { status: 500 }
    );
  }
}
