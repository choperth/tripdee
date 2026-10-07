import { NextRequest, NextResponse } from 'next/server';
import { getOrigin } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const { searchParams } = new URL(req.url);
  const requestedRole = searchParams.get('role');
  // Security (CWE-269): Never allow requesting 'admin' role via public OAuth query parameter.
  const role = requestedRole === 'driver' ? 'driver' : 'customer';
  const next = searchParams.get('next') || '/';

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    const errorUrl = new URL(next, origin);
    errorUrl.searchParams.set('auth_error', 'Google login is not configured on this server (Missing GOOGLE_CLIENT_ID)');
    return NextResponse.redirect(errorUrl.toString());
  }

  // Encode state with role, return path, and random nonce
  const statePayload = {
    role,
    next,
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
