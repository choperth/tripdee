import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, SESSION_COOKIE } from '@/lib/authGuard';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/driver') && pathname !== '/driver/login') {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const loginUrl = new URL('/driver/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*'],
};
