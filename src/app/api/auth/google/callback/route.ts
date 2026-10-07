import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { createSessionToken, withSessionCookie } from '@/lib/authGuard';

function getOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = req.headers.get('host');
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  let role: 'driver' | 'customer' = 'customer';
  let next = '/';

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      // Security (CWE-269): Strictly sanitize role to driver/customer only
      if (decoded.role === 'driver') role = 'driver';
      if (decoded.next && typeof decoded.next === 'string' && decoded.next.startsWith('/')) {
        next = decoded.next;
      }
    } catch (e) {
      console.warn('[TripDee Google Auth] Failed to parse state:', e);
    }
  }

  // If user cancelled on Google consent screen or error occurred
  if (error || !code) {
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth_error', errorDescription || error || 'Google login was cancelled');
    return NextResponse.redirect(targetUrl.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error('[TripDee Google Auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment');
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth_error', 'Google login credentials not configured on server');
    return NextResponse.redirect(targetUrl.toString());
  }

  try {
    // 1. Exchange authorization code for access_token and id_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      let errDetail = 'Failed to exchange authorization token with Google';
      try {
        const errJson = await tokenRes.json();
        errDetail = errJson.error_description || errJson.error || errDetail;
      } catch {
        /* ignore */
      }
      const targetUrl = new URL(next, origin);
      targetUrl.searchParams.set('auth_error', errDetail);
      return NextResponse.redirect(targetUrl.toString());
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;
    const idToken = tokenData.id_token as string | undefined;

    // 2. Fetch User Profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch Google profile');
    }

    const profile = await profileRes.json();

    // 3. Optional Supabase Auth sync via signInWithIdToken
    const supabase = getSupabase();
    if (supabase && idToken) {
      try {
        await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
      } catch (sbErr) {
        console.warn('[TripDee Google Auth] Supabase id_token sync notice:', sbErr);
      }
    }

    // 4. Construct UserProfile
    const userProfile = {
      id: `google_${profile.sub}`,
      role,
      name: profile.name || profile.email?.split('@')[0] || 'Google User',
      driverNickname: role === 'driver' ? (profile.given_name || profile.name) : undefined,
      emailOrPhone: profile.email || 'Google Account',
      avatar: profile.picture || undefined,
      customerType: role === 'customer' ? ('individual' as const) : undefined,
      isAvailable: role === 'driver' ? true : undefined,
      verificationStatus: role === 'driver' ? ('pending' as const) : undefined,
    };

    // 5. Send an HTML bridge that sets the user into localStorage and redirects to `next`
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth', 'success');
    targetUrl.searchParams.set('role', role);

    const safeTargetUrl = targetUrl.toString();
    const safeUserJson = JSON.stringify(userProfile);

    // 5b. Issue a signed, httpOnly session cookie so the API can verify which
    // driver a request belongs to. localStorage alone is not trustworthy for
    // authorisation decisions.
    const { token } = await createSessionToken({
      userId: userProfile.id,
      role,
      email: userProfile.emailOrPhone,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>เข้าสู่ระบบ Google สำเร็จ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
  <div style="text-align: center; padding: 28px; background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); max-width: 320px; width: 90%;">
    <div style="width: 52px; height: 52px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <svg width="28" height="28" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
    </div>
    <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 18px; font-weight: 700;">เข้าสู่ระบบ Google สำเร็จ</h3>
    <p style="margin: 0; font-size: 13px; color: #64748b;">กำลังพาท่านกลับสู่ TripDee...</p>
  </div>
  <script>
    try {
      localStorage.setItem('td-auth-user', ${JSON.stringify(safeUserJson)});
      window.dispatchEvent(new CustomEvent('tripdee-auth-updated'));
    } catch (e) {
      console.error(e);
    }
    window.location.replace(${JSON.stringify(safeTargetUrl)});
  </script>
</body>
</html>`;

    return withSessionCookie(
      new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }),
      token
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Google OAuth internal error';
    console.error('[TripDee Google Auth] Unexpected error:', err);
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth_error', errorMsg);
    return NextResponse.redirect(targetUrl.toString());
  }
}
