import { NextResponse } from 'next/server';
import { sendDriverNotification, DriverLeadPayload } from '@/lib/notification';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DriverLeadPayload;
    if (!body.phone || !body.driverName) {
      return NextResponse.json({ error: 'Missing driver info' }, { status: 400 });
    }

    // Trigger free webhook notifications (Discord / Telegram / Google Sheet)
    const notifyResults = await sendDriverNotification(body);

    return NextResponse.json({
      success: true,
      message: 'Driver registration received successfully',
      notified: notifyResults,
    });
  } catch (error) {
    console.error('API /leads/driver error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
