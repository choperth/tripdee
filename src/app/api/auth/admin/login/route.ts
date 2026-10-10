import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPin, createSessionToken, withAdminSessionCookie } from '@/lib/authGuard';

export const dynamic = 'force-dynamic';

/**
 * Exchange the admin passphrase for a signed, httpOnly admin session cookie.
 * The secret never leaves the server, so it is not exposed in the client bundle.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = String((body as { pin?: unknown })?.pin ?? '');

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin passphrase' },
        { status: 401 }
      );
    }

    const { token } = await createSessionToken({ userId: 'admin', role: 'admin' });
    return withAdminSessionCookie(NextResponse.json({ success: true, role: 'admin' }), token);
  } catch (err) {
    console.error('[API /api/auth/admin/login] Error:', err);
    return NextResponse.json({ success: false, error: 'Admin login failed' }, { status: 500 });
  }
}
