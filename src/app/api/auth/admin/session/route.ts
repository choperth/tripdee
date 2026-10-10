import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, withoutAdminSessionCookie } from '@/lib/authGuard';

export const dynamic = 'force-dynamic';

/** Report whether this browser currently holds a valid admin session. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  return NextResponse.json({ authenticated: Boolean(session) });
}

export async function DELETE() {
  return withoutAdminSessionCookie(NextResponse.json({ success: true }));
}
