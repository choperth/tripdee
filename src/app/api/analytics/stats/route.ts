import { NextRequest, NextResponse } from 'next/server';
import { fetchAnalyticsSummary, resetAnalyticsEvents } from '@/lib/supabase/service';
import { verifyAdminAccess, unauthorizedAdminResponse } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
  }

  const summary = await fetchAnalyticsSummary();
  return NextResponse.json({
    success: true,
    summary,
  });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'reset') {
      const fresh = await resetAnalyticsEvents();
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
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
  }

  try {
    const fresh = await resetAnalyticsEvents();
    return NextResponse.json({
      success: true,
      message: 'Analytics cleared',
      summary: fresh,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear analytics', details: String(err) },
      { status: 500 }
    );
  }
}
