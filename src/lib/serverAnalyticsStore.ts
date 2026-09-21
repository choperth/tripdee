import { AnalyticsEvent, AnalyticsSummary, computeUpdatedSummary, createEmptySummary } from './analytics';

declare global {
  var __tripdee_server_analytics__: AnalyticsSummary | undefined;
}

function getServerStore(): AnalyticsSummary {
  if (!globalThis.__tripdee_server_analytics__) {
    globalThis.__tripdee_server_analytics__ = createEmptySummary();
  }
  return globalThis.__tripdee_server_analytics__;
}

export function recordServerAnalyticsEvent(event: AnalyticsEvent): AnalyticsSummary {
  const current = getServerStore();
  const updated = computeUpdatedSummary(current, event);
  globalThis.__tripdee_server_analytics__ = updated;
  return updated;
}

export function getServerAnalyticsSummary(): AnalyticsSummary {
  return getServerStore();
}

export function resetServerAnalytics(): AnalyticsSummary {
  const fresh = createEmptySummary();
  globalThis.__tripdee_server_analytics__ = fresh;
  return fresh;
}
