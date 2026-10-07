import { NextRequest, NextResponse } from 'next/server';
import { getServerAnalyticsSummary, resetServerAnalytics } from '@/lib/serverAnalyticsStore';
import { verifyAdminAccess, unauthorizedAdminResponse } from '@/lib/authGuard';

export async function GET() {
  const summary = getServerAnalyticsSummary();
  return NextResponse.json({
    success: true,
    summary,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'reset') {
      const fresh = resetServerAnalytics();
      return NextResponse.json({
        success: true,
        message: 'Analytics reset successfully',
        summary: fresh,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to handle request', details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return unauthorizedAdminResponse();
  }

  const fresh = resetServerAnalytics();
  return NextResponse.json({
    success: true,
    message: 'Analytics cleared',
    summary: fresh,
  });
}
