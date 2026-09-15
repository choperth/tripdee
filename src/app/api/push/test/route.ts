import { NextRequest, NextResponse } from 'next/server';
import { sendPushToSubscription } from '@/lib/pushService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing subscription details for test notification' },
        { status: 400 }
      );
    }

    await sendPushToSubscription(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      {
        title: '🔔 ทดสอบการแจ้งเตือนงาน TripDee สำเร็จ!',
        body: 'ระบบพร้อมส่งงานใหม่เข้าสู่มือถือของคุณทันทีเมื่อมีลูกค้าลงประกาศบอร์ด แตะเพื่อทดสอบเปิด TripDee',
        url: '/#trip-board',
        tag: 'tripdee-test-notification',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (err) {
    console.error('[API /api/push/test] Error sending test notification:', err);
    return NextResponse.json(
      { error: 'Failed to send test push notification', details: String(err) },
      { status: 500 }
    );
  }
}
