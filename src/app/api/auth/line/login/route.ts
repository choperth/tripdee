import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const role = searchParams.get('role') || 'customer';
  const next = searchParams.get('next') || '/';

  const clientId = process.env.LINE_CLIENT_ID || '2011750506';
  const redirectUri = `${origin}/api/auth/line/callback`;

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
