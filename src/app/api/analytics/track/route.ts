import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/lib/analytics';
import { recordServerAnalyticsEvent } from '@/lib/serverAnalyticsStore';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyticsEvent>;
    if (!body || !body.type || (body.type !== 'sponsor_click' && body.type !== 'call_click')) {
      return NextResponse.json(
        { error: 'Invalid event payload. Type must be sponsor_click or call_click.' },
        { status: 400 }
      );
    }

    const event: AnalyticsEvent = {
      ...body,
      id: body.id || `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: body.timestamp || new Date().toISOString(),
    } as AnalyticsEvent;

    const updatedSummary = recordServerAnalyticsEvent(event);

    return NextResponse.json({
      success: true,
      event,
      totalEvents: updatedSummary.totalEvents,
      totalSponsorClicks: updatedSummary.totalSponsorClicks,
      totalCallClicks: updatedSummary.totalCallClicks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process tracking event', details: String(err) },
      { status: 500 }
    );
  }
}
