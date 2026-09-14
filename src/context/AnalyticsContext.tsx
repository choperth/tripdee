'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AnalyticsSummary,
  AnalyticsEvent,
  SponsorClickVariant,
  CallTargetType,
  createEmptySummary,
  getLocalAnalyticsSummary,
  trackSponsorClick as trackSponsorClickCore,
  trackCallClick as trackCallClickCore,
  resetAnalyticsData as resetAnalyticsDataCore,
  subscribeToAnalytics,
} from '@/lib/analytics';

interface AnalyticsContextType {
  summary: AnalyticsSummary;
  trackSponsor: (params: {
    sponsorId: string;
    sponsorTitle: string;
    category: string;
    variant?: SponsorClickVariant;
    targetUrl: string;
  }) => AnalyticsEvent;
  trackCall: (params: {
    targetType: CallTargetType;
    targetId: string;
    targetTitle: string;
    phoneNumber: string;
    driverName?: string;
  }) => AnalyticsEvent;
  getSponsorClickCount: (sponsorId: string) => number;
  getCallClickCount: (targetId: string) => number;
  resetAnalytics: () => void;
  refresh: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<AnalyticsSummary>(() => {
    if (typeof window === 'undefined') return createEmptySummary();
    return getLocalAnalyticsSummary();
  });

  const refresh = useCallback(() => {
    setSummary(getLocalAnalyticsSummary());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAnalytics((newSummary) => {
      setSummary(newSummary);
    });
    return unsubscribe;
  }, []);

  const trackSponsor = useCallback(
    (params: {
      sponsorId: string;
      sponsorTitle: string;
      category: string;
      variant?: SponsorClickVariant;
      targetUrl: string;
    }) => {
      const event = trackSponsorClickCore(params);
      return event;
    },
    []
  );

  const trackCall = useCallback(
    (params: {
      targetType: CallTargetType;
      targetId: string;
      targetTitle: string;
      phoneNumber: string;
      driverName?: string;
    }) => {
      const event = trackCallClickCore(params);
      return event;
    },
    []
  );

  const getSponsorClickCount = useCallback(
    (sponsorId: string) => {
      return summary.sponsorStats[sponsorId]?.clicks || 0;
    },
    [summary.sponsorStats]
  );

  const getCallClickCount = useCallback(
    (targetId: string) => {
      return summary.callStats.byTarget[targetId]?.clicks || 0;
    },
    [summary.callStats.byTarget]
  );

  const resetAnalytics = useCallback(() => {
    resetAnalyticsDataCore();
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        summary,
        trackSponsor,
        trackCall,
        getSponsorClickCount,
        getCallClickCount,
        resetAnalytics,
        refresh,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return ctx;
};
