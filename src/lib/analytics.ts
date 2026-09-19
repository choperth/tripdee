/**
 * TripDee Analytics Click Counter System
 * Handles tracking and statistics aggregation for:
 * 1. Sponsor button clicks (Sponsor CTA, affiliate links)
 * 2. Driver & Fleet Phone Call button clicks (tel: links)
 */

export type SponsorClickVariant = 'split' | 'strip' | 'card' | 'footer' | 'sidebar' | 'unknown';
export type CallTargetType =
  | 'vehicle_card'
  | 'vehicle_detail'
  | 'driver_fleet'
  | 'trip_board'
  | 'sponsor'
  | 'admin_fleet'
  | 'driver_job'
  | 'corporate_quote';

export interface SponsorClickEvent {
  type: 'sponsor_click';
  id: string;
  timestamp: string;
  sponsorId: string;
  sponsorTitle: string;
  category: string;
  variant: SponsorClickVariant;
  targetUrl: string;
}

export interface CallClickEvent {
  type: 'call_click';
  id: string;
  timestamp: string;
  targetType: CallTargetType;
  targetId: string;
  targetTitle: string;
  phoneNumber: string;
  driverName?: string;
}

export type AnalyticsEvent = SponsorClickEvent | CallClickEvent;

export interface SponsorStat {
  sponsorId: string;
  sponsorTitle: string;
  category: string;
  clicks: number;
  lastClickedAt: string;
}

export interface CallTargetStat {
  targetId: string;
  targetTitle: string;
  targetType: CallTargetType;
  phoneNumber: string;
  driverName?: string;
  clicks: number;
  lastClickedAt: string;
}

export interface AnalyticsSummary {
  totalEvents: number;
  totalSponsorClicks: number;
  totalCallClicks: number;
  sponsorStats: Record<string, SponsorStat>;
  callStats: {
    byTargetType: Record<CallTargetType, number>;
    byTarget: Record<string, CallTargetStat>;
    byPhone: Record<string, number>;
  };
  recentEvents: AnalyticsEvent[];
  lastUpdated: string;
}

const STORAGE_SUMMARY_KEY = 'td_analytics_summary_v1';
const STORAGE_EVENTS_KEY = 'td_analytics_events_v1';
const ANALYTICS_EVENT_NAME = 'td_analytics_change';
const MAX_RECENT_EVENTS = 100;

export function createEmptySummary(): AnalyticsSummary {
  return {
    totalEvents: 0,
    totalSponsorClicks: 0,
    totalCallClicks: 0,
    sponsorStats: {},
    callStats: {
      byTargetType: {
        vehicle_card: 0,
        vehicle_detail: 0,
        driver_fleet: 0,
        trip_board: 0,
        sponsor: 0,
        admin_fleet: 0,
        driver_job: 0,
        corporate_quote: 0,
      },
      byTarget: {},
      byPhone: {},
    },
    recentEvents: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Reads the latest summary from localStorage (browser-only)
 */
export function getLocalAnalyticsSummary(): AnalyticsSummary {
  if (typeof window === 'undefined') {
    return createEmptySummary();
  }

  try {
    const raw = localStorage.getItem(STORAGE_SUMMARY_KEY);
    if (!raw) return createEmptySummary();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : createEmptySummary();
  } catch {
    return createEmptySummary();
  }
}

/**
 * Computes updated summary with a new event
 */
export function computeUpdatedSummary(
  prev: AnalyticsSummary,
  event: AnalyticsEvent
): AnalyticsSummary {
  const next: AnalyticsSummary = {
    ...prev,
    totalEvents: prev.totalEvents + 1,
    lastUpdated: event.timestamp,
    sponsorStats: { ...prev.sponsorStats },
    callStats: {
      byTargetType: { ...prev.callStats.byTargetType },
      byTarget: { ...prev.callStats.byTarget },
      byPhone: { ...prev.callStats.byPhone },
    },
    recentEvents: [event, ...(prev.recentEvents || [])].slice(0, MAX_RECENT_EVENTS),
  };

  if (event.type === 'sponsor_click') {
    next.totalSponsorClicks += 1;
    const existing = next.sponsorStats[event.sponsorId];
    next.sponsorStats[event.sponsorId] = {
      sponsorId: event.sponsorId,
      sponsorTitle: event.sponsorTitle,
      category: event.category,
      clicks: (existing?.clicks || 0) + 1,
      lastClickedAt: event.timestamp,
    };
  } else if (event.type === 'call_click') {
    next.totalCallClicks += 1;
    const targetType = event.targetType;
    next.callStats.byTargetType[targetType] = (next.callStats.byTargetType[targetType] || 0) + 1;

    const existingTarget = next.callStats.byTarget[event.targetId];
    next.callStats.byTarget[event.targetId] = {
      targetId: event.targetId,
      targetTitle: event.targetTitle,
      targetType: event.targetType,
      phoneNumber: event.phoneNumber,
      driverName: event.driverName,
      clicks: (existingTarget?.clicks || 0) + 1,
      lastClickedAt: event.timestamp,
    };

    const cleanPhone = event.phoneNumber.trim();
    if (cleanPhone) {
      next.callStats.byPhone[cleanPhone] = (next.callStats.byPhone[cleanPhone] || 0) + 1;
    }
  }

  return next;
}

/**
 * Sends event to server API endpoint safely in background
 */
async function sendEventToServer(event: AnalyticsEvent): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(event);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/analytics/track', blob);
      if (sent) return;
    }

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Graceful offline fallback: server tracking is secondary to client telemetry
  }
}

/**
 * Dual Google Analytics 4 (GA4) Event Dispatcher
 */
export function sendGA4Event(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, params);
    }
  } catch {
    /* ignore GA4 dispatch errors */
  }
}

/**
 * Core event tracking dispatcher
 */
export function recordAnalyticsEvent(event: AnalyticsEvent): AnalyticsSummary {
  if (typeof window === 'undefined') {
    return createEmptySummary();
  }

  const currentSummary = getLocalAnalyticsSummary();
  const updatedSummary = computeUpdatedSummary(currentSummary, event);

  try {
    localStorage.setItem(STORAGE_SUMMARY_KEY, JSON.stringify(updatedSummary));

    // Append to events log
    const rawEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
    const events: AnalyticsEvent[] = rawEvents ? JSON.parse(rawEvents) : [];
    events.unshift(event);
    if (events.length > MAX_RECENT_EVENTS) {
      events.length = MAX_RECENT_EVENTS;
    }
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
  } catch {
    /* ignore storage quota errors */
  }

  // Broadcast to all reactive UI listeners
  try {
    window.dispatchEvent(
      new CustomEvent(ANALYTICS_EVENT_NAME, {
        detail: { event, summary: updatedSummary },
      })
    );
  } catch {
    /* ignore dispatch error */
  }

  // Send to server in background
  sendEventToServer(event);

  return updatedSummary;
}

/**
 * Track Sponsor CTA Click
 */
export function trackSponsorClick(params: {
  sponsorId: string;
  sponsorTitle: string;
  category: string;
  variant?: SponsorClickVariant;
  targetUrl: string;
}): AnalyticsEvent {
  const event: SponsorClickEvent = {
    type: 'sponsor_click',
    id: `ev-sp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    sponsorId: params.sponsorId,
    sponsorTitle: params.sponsorTitle,
    category: params.category,
    variant: params.variant || 'split',
    targetUrl: params.targetUrl,
  };

  recordAnalyticsEvent(event);
  sendGA4Event('sponsor_click', {
    sponsor_id: params.sponsorId,
    sponsor_title: params.sponsorTitle,
    sponsor_category: params.category,
    variant: params.variant || 'split',
    target_url: params.targetUrl,
  });
  return event;
}
/**
 * Track Call / Phone Button Click
 */
export function trackCallClick(params: {
  targetType: CallTargetType;
  targetId: string;
  targetTitle: string;
  phoneNumber: string;
  driverName?: string;
}): AnalyticsEvent {
  const event: CallClickEvent = {
    type: 'call_click',
    id: `ev-call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    targetType: params.targetType,
    targetId: params.targetId,
    targetTitle: params.targetTitle,
    phoneNumber: params.phoneNumber,
    driverName: params.driverName,
  };

  recordAnalyticsEvent(event);
  sendGA4Event('call_click', {
    target_type: params.targetType,
    target_id: params.targetId,
    target_title: params.targetTitle,
    phone_number: params.phoneNumber,
    driver_name: params.driverName || '',
  });
  return event;
}
/**
 * Reset all analytics data (for admin or testing)
 */
export function resetAnalyticsData(): void {
  if (typeof window === 'undefined') return;
  const empty = createEmptySummary();
  try {
    localStorage.removeItem(STORAGE_SUMMARY_KEY);
    localStorage.removeItem(STORAGE_EVENTS_KEY);
  } catch {
    /* ignore */
  }

  try {
    window.dispatchEvent(
      new CustomEvent(ANALYTICS_EVENT_NAME, {
        detail: { summary: empty },
      })
    );
  } catch {
    /* ignore */
  }

  // Inform server of reset
  fetch('/api/analytics/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  }).catch(() => {});
}

/**
 * Subscribes to real-time analytics updates
 */
export function subscribeToAnalytics(
  callback: (summary: AnalyticsSummary, lastEvent?: AnalyticsEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ summary: AnalyticsSummary; event?: AnalyticsEvent }>;
    if (customEvent.detail?.summary) {
      callback(customEvent.detail.summary, customEvent.detail.event);
    } else {
      callback(getLocalAnalyticsSummary());
    }
  };

  window.addEventListener(ANALYTICS_EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_SUMMARY_KEY) {
      callback(getLocalAnalyticsSummary());
    }
  });

  return () => {
    window.removeEventListener(ANALYTICS_EVENT_NAME, handler);
  };
}
