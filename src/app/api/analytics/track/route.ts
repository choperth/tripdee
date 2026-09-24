import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEvent, CallClickEvent } from '@/lib/analytics';
import {
  getServerAnalyticsSummary,
  evaluateServerClickFraud,
} from '@/lib/serverAnalyticsStore';
import { logAnalyticsEvent } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyticsEvent>;
    if (!body || !body.type || (body.type !== 'sponsor_click' && body.type !== 'call_click')) {
      return NextResponse.json(
        { error: 'Invalid event payload. Type must be sponsor_click or call_click.' },
        { status: 400 }
      );
    }

    // Extract client network and device attributes
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const ip =
      cfConnectingIp ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
      realIp ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // Formulate target key for deduplication
    const targetKey =
      body.type === 'sponsor_click'
        ? `sp_${body.sponsorId || 'unknown'}`
        : `call_${(body as Partial<CallClickEvent>).targetId || 'unknown'}`;

    // Perform server anti-fraud evaluation
    const fraudCheck = evaluateServerClickFraud({
      ip,
      userAgent,
      visitorId: body.visitorId,
      targetKey,
    });

    const event: AnalyticsEvent = {
      ...body,
      id: body.id || `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      isUnique: fraudCheck.isUnique,
      isSpam: fraudCheck.isSpam,
    } as AnalyticsEvent;

    // Log event in database (and update server in-memory summary)
    await logAnalyticsEvent(event);
    const updatedSummary = getServerAnalyticsSummary();

    return NextResponse.json({
      success: true,
      event,
      fraudCheck: {
        isUnique: fraudCheck.isUnique,
        isSpam: fraudCheck.isSpam,
        isBot: fraudCheck.isBot,
        reason: fraudCheck.reason,
      },
      totalEvents: updatedSummary.totalEvents,
      totalSponsorClicks: updatedSummary.totalSponsorClicks,
      uniqueSponsorClicks: updatedSummary.uniqueSponsorClicks,
      totalCallClicks: updatedSummary.totalCallClicks,
      uniqueCallClicks: updatedSummary.uniqueCallClicks,
      spamBlockedClicks: updatedSummary.spamBlockedClicks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process tracking event', details: String(err) },
      { status: 500 }
    );
  }
}
