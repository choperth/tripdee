import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription, removeSubscription } from '@/lib/pushService';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  return NextResponse.json({
    success: true,
    publicKey,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, role } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing required subscription fields (endpoint, keys.p256dh, keys.auth)' },
        { status: 400 }
      );
    }

    const saved = await saveSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      role: role || 'driver',
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: saved.id,
    });
  } catch (err) {
    console.error('[API /api/push/subscribe] Error saving subscription:', err);
    return NextResponse.json(
      { error: 'Failed to save push subscription', details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 });
    }

    await removeSubscription(endpoint);
    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('[API /api/push/subscribe] Error removing subscription:', err);
    return NextResponse.json(
      { error: 'Failed to remove push subscription', details: String(err) },
      { status: 500 }
    );
  }
}
