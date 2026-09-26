import { NextRequest, NextResponse } from 'next/server';

interface UserProfilePayload {
  id: string;
  role: 'driver' | 'customer' | 'admin';
  name: string;
  emailOrPhone: string;
  avatar?: string;
  lineId?: string;
  isAvailable?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  let role: 'driver' | 'customer' | 'admin' = 'customer';
  let next = '/';

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      if (decoded.role) role = decoded.role;
      if (decoded.next) next = decoded.next;
    } catch (e) {
      console.warn('[TripDee LINE Auth] Failed to parse state:', e);
    }
  }

  // If user cancelled on LINE consent screen or error occurred
  if (error || !code) {
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth_error', errorDescription || error || 'LINE login was cancelled');
    return NextResponse.redirect(targetUrl.toString());
  }

  const clientId = process.env.LINE_CLIENT_ID || '2011750506';
  const clientSecret = process.env.LINE_CLIENT_SECRET || 'fd99de2a24bcd1e45f674faff8277db9';
  const redirectUri = `${origin}/api/auth/line/callback`;

  try {
    // 1. Exchange authorization code for access_token and id_token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[TripDee LINE Auth] Token exchange failed:', errText);
      const targetUrl = new URL(next, origin);
      targetUrl.searchParams.set('auth_error', 'LINE Token Exchange Failed');
      return NextResponse.redirect(targetUrl.toString());
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;
    const idToken = tokenData.id_token as string | undefined;

    // 2. Fetch User Profile from LINE
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch LINE profile');
    }

    const profile = await profileRes.json();

    // 3. Extract Email from id_token if permitted
    let email: string | undefined = undefined;
    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.email) email = payload.email as string;
        }
      } catch {
        /* ignore parse error */
      }
    }

    // 4. Construct UserProfile
    const userProfile: UserProfilePayload = {
      id: `line_${profile.userId}`,
      role,
      name: profile.displayName || 'LINE User',
      emailOrPhone: email || profile.displayName || 'LINE Account',
      avatar: profile.pictureUrl || undefined,
      lineId: `@${profile.displayName || ''}`.replace(/\s+/g, ''),
      isAvailable: role === 'driver' ? true : undefined,
      verificationStatus: role === 'driver' ? 'pending' : undefined,
    };

    // 5. Send an HTML bridge that sets the user into localStorage and redirects to `next`
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth', 'success');
    targetUrl.searchParams.set('role', role);

    const safeTargetUrl = targetUrl.toString();
    const safeUserJson = JSON.stringify(userProfile);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>เข้าสู่ระบบ LINE สำเร็จ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
  <div style="text-align: center; padding: 28px; background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); max-width: 320px; width: 90%;">
    <div style="width: 52px; height: 52px; background: #06C755; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.08L5 22l4.13-1.84C10.04 20.64 11 20.8 12 20.8c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg>
    </div>
    <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 18px; font-weight: 700;">เข้าสู่ระบบ LINE สำเร็จ</h3>
    <p style="margin: 0; font-size: 13px; color: #64748b;">กำลังพาท่านกลับสู่ TripDee...</p>
  </div>
  <script>
    try {
      localStorage.setItem('td-auth-user', ${safeUserJson});
      window.dispatchEvent(new CustomEvent('tripdee-auth-updated'));
    } catch (e) {
      console.error(e);
    }
    window.location.replace(${JSON.stringify(safeTargetUrl)});
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: unknown) {
    console.error('[TripDee LINE Auth] Unexpected error:', err);
    const targetUrl = new URL(next, origin);
    targetUrl.searchParams.set('auth_error', 'LINE login failed unexpectedly');
    return NextResponse.redirect(targetUrl.toString());
  }
}
