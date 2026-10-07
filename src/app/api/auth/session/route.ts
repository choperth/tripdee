import { NextRequest, NextResponse } from 'next/server';
import {
  getDriverSession,
  withoutSessionCookie,
} from '@/lib/authGuard';

export const dynamic = 'force-dynamic';

/** Report who the server currently believes this browser is. */
export async function GET(req: NextRequest) {
  const session = await getDriverSession(req);
  return NextResponse.json({
    authenticated: Boolean(session),
    userId: session?.userId ?? null,
    role: session?.role ?? null,
  });
}

export async function DELETE() {
  return withoutSessionCookie(NextResponse.json({ success: true }));
}
