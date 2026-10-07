import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates whether the incoming request is authorized as an Admin.
 * Checks for:
 * 1. Authorization: Bearer <ADMIN_PIN>
 * 2. x-admin-pin: <ADMIN_PIN>
 * 3. Cookie: td-admin-token = <ADMIN_PIN>
 */
export function verifyAdminAccess(req: NextRequest): boolean {
  const adminSecret = getAdminSecret();
  // No configured secret means no admin access. Never fall back to a known value.
  if (!adminSecret) return false;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (timingSafeEqual(token, adminSecret)) return true;
  }

  // 2. Check x-admin-pin or x-admin-secret header
  const pinHeader = req.headers.get('x-admin-pin') || req.headers.get('x-admin-secret');
  if (pinHeader && timingSafeEqual(pinHeader.trim(), adminSecret)) {
    return true;
  }

  // 3. Check admin cookie
  const cookieToken = req.cookies.get('td-admin-token')?.value;
  if (cookieToken && timingSafeEqual(cookieToken.trim(), adminSecret)) {
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

// ---------------------------------------------------------------------------
// Signed driver session
//
// The driver's identity is established at OAuth callback time and carried in an
// httpOnly, HMAC-signed cookie. Without this the API has no way to tell whose
// vehicle a request is trying to edit: localStorage is attacker-controlled and
// was the only thing linking a driver to their vehicle.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = 'td-session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = 'driver' | 'customer';

export interface DriverSession {
  /** Auth provider user id, e.g. `google_<sub>` or `line_<userId>`. */
  userId: string;
  role: SessionRole;
  email?: string;
  issuedAt: number;
  expiresAt: number;
}

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET_KEY || process.env.NEXT_PUBLIC_ADMIN_PIN || '';
}

/**
 * Signing key. Prefers a dedicated SESSION_SECRET; otherwise derives one from
 * the service role key so a deploy without SESSION_SECRET still gets tamper
 * protection rather than silently falling back to an unsigned cookie.
 */
function getSessionSecret(): string {
  const explicit = process.env.SESSION_SECRET;
  if (explicit) return explicit;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return serviceKey;
  return getAdminSecret();
}

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64Url(new Uint8Array(sig));
}

function base64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Constant-time string compare that does not leak length via early exit. */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

/** Create a signed session token for a freshly authenticated user. */
export async function createSessionToken(input: {
  userId: string;
  role: SessionRole;
  email?: string;
}): Promise<{ token: string; session: DriverSession }> {
  const now = Math.floor(Date.now() / 1000);
  const session: DriverSession = {
    userId: input.userId,
    role: input.role,
    email: input.email,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS,
  };
  const body = base64Url(new TextEncoder().encode(JSON.stringify(session)));
  const sig = await hmac(body, getSessionSecret());
  return { token: `${body}.${sig}`, session };
}

/**
 * Verify a session token and return its payload, or null when the token is
 * malformed, tampered with, or expired.
 */
export async function verifySessionToken(token: string | undefined): Promise<DriverSession | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(body, getSessionSecret());
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(body))
    ) as DriverSession;
    if (!session?.userId || typeof session.expiresAt !== 'number') return null;
    if (session.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Read and verify the driver session attached to a request. */
export async function getDriverSession(req: NextRequest): Promise<DriverSession | null> {
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) return session;
  }

  // Fallback: bearer token, so non-browser clients can authenticate too.
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Session ')) {
    return verifySessionToken(authHeader.slice(7).trim());
  }
  return null;
}

/** Response that installs the signed session cookie. */
export function withSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

/** Response that clears the signed session cookie. */
export function withoutSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

export function unauthorizedDriverResponse(
  message = 'Unauthorized: Please sign in to manage your vehicle'
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
