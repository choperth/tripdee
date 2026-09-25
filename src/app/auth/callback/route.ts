import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') || 'customer';
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[TripDee Auth Callback] Exchange error:', error);
          return NextResponse.redirect(
            `${origin}/?auth_error=${encodeURIComponent(error.message)}`
          );
        }
      } catch (err) {
        console.error('[TripDee Auth Callback] Exception exchanging code:', err);
      }
    }
  }

  // Redirect user back to home or target page with login feedback params
  const targetUrl = new URL(next, origin);
  targetUrl.searchParams.set('auth', 'success');
  targetUrl.searchParams.set('role', role);

  return NextResponse.redirect(targetUrl.toString());
}
