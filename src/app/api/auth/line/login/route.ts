import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const requestedRole = searchParams.get('role');
  // Security (CWE-269): Never allow requesting 'admin' role via public OAuth query parameter.
  const role = requestedRole === 'driver' ? 'driver' : 'customer';
  const next = searchParams.get('next') || '/';

  const clientId = process.env.LINE_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/line/callback`;
  if (!clientId) {
    const errorUrl = new URL(next, origin);
    errorUrl.searchParams.set('auth_error', 'LINE login is not configured on this server');
    return NextResponse.redirect(errorUrl.toString());
  }

  // Encode state with role, return path, and random nonce
  const statePayload = {
    role,
    next,
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.set('response_type', 'code');
  lineAuthUrl.searchParams.set('client_id', clientId);
  lineAuthUrl.searchParams.set('redirect_uri', redirectUri);
  lineAuthUrl.searchParams.set('state', state);
  lineAuthUrl.searchParams.set('scope', 'profile openid email');
  lineAuthUrl.searchParams.set('bot_prompt', 'normal');

  return NextResponse.redirect(lineAuthUrl.toString());
}
