import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates whether the incoming request is authorized as an Admin.
 * Checks for:
 * 1. Authorization: Bearer <ADMIN_PIN>
 * 2. x-admin-pin: <ADMIN_PIN>
 * 3. Cookie: td-admin-token = <ADMIN_PIN>
 */
export function verifyAdminAccess(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.NEXT_PUBLIC_ADMIN_PIN || 'tripdee2026';

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === adminSecret) return true;
  }

  // 2. Check x-admin-pin or x-admin-secret header
  const pinHeader = req.headers.get('x-admin-pin') || req.headers.get('x-admin-secret');
  if (pinHeader && pinHeader.trim() === adminSecret) {
    return true;
  }

  // 3. Check admin cookie
  const cookieToken = req.cookies.get('td-admin-token')?.value;
  if (cookieToken && cookieToken.trim() === adminSecret) {
    return true;
  }

  return false;
}

export function unauthorizedAdminResponse(message = 'Unauthorized: Admin access required'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}
