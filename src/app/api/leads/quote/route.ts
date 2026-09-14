import { NextResponse } from 'next/server';
import { sendQuotationNotification, QuotationLeadPayload } from '@/lib/notification';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuotationLeadPayload;
    if (!body.phone && !body.companyName) {
      return NextResponse.json({ error: 'Missing contact info' }, { status: 400 });
    }

    // Trigger free webhook notifications (Discord / Telegram / Google Sheet)
    const notifyResults = await sendQuotationNotification(body);

    return NextResponse.json({
      success: true,
      message: 'Quotation request received successfully',
      notified: notifyResults,
    });
  } catch (error) {
    console.error('API /leads/quote error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
