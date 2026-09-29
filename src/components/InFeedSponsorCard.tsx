'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sponsor, SPONSORS } from '@/data/mockData';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSponsor } from '@/lib/sponsorLocalization';
import { MapPin, Tag, ExternalLink, Phone } from 'lucide-react';

interface InFeedSponsorCardProps {
  sponsor?: Sponsor;
  sponsors?: Sponsor[];
  initialIndex?: number;
  interval?: number;
}

export const InFeedSponsorCard: React.FC<InFeedSponsorCardProps> = ({
  sponsor: rawSponsor,
  sponsors: customSponsors,
  initialIndex = 0,
  interval = 5500,
}) => {
  const { trackSponsor, trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  // Resolve sponsor list: custom array -> default all SPONSORS -> fallback single sponsor
  const rawList = React.useMemo(() => {
    if (customSponsors && customSponsors.length > 0) return customSponsors;
    if (rawSponsor) return [rawSponsor];
    return SPONSORS;
  }, [customSponsors, rawSponsor]);

  const sponsorsList = React.useMemo(() => {
    return rawList.map((s) => getLocalizedSponsor(s, locale));
  }, [rawList, locale]);

  const N = sponsorsList.length;
  // Extended slides with boundary clones for seamless forward looping
  const extendedSlides = React.useMemo(() => {
    if (N <= 1) return sponsorsList;
    return [sponsorsList[N - 1], ...sponsorsList, sponsorsList[0]];
  }, [sponsorsList, N]);

  // Index 1 corresponds to real item 0 (+1 offset for the leading clone)
  const [currentIndex, setCurrentIndex] = useState(() =>
    N <= 1 ? 1 : Math.min(Math.max(initialIndex, 0), N - 1) + 1
  );
  const [enableTransition, setEnableTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isAnimating = useRef(false);
  const touchStartX = useRef<number | null>(null);

  // Derive real active sponsor index (0 to N-1) for indicators & top bar
  const activeRealIndex = N <= 1 ? 0 : currentIndex === 0 ? N - 1 : currentIndex === N + 1 ? 0 : currentIndex - 1;
  const currentSponsor = sponsorsList[activeRealIndex] || sponsorsList[0];

  const handleNext = React.useCallback(() => {
    if (isAnimating.current || N <= 1) return;
    isAnimating.current = true;
    setEnableTransition(true);
    setCurrentIndex((prev) => prev + 1);
  }, [N]);

  const handlePrev = () => {
    if (isAnimating.current || N <= 1) return;
    isAnimating.current = true;
    setEnableTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleDotClick = (targetIndex: number) => {
    if (isAnimating.current || N <= 1) return;
    isAnimating.current = true;
    setEnableTransition(true);
    setCurrentIndex(targetIndex + 1);
  };

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    isAnimating.current = false;
    if (currentIndex === N + 1) {
      // Reached the clone of first item: instantly snap to real first item (index 1) with no animation
      setEnableTransition(false);
      setCurrentIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
    } else if (currentIndex === 0) {
      // Reached the clone of last item: instantly snap to real last item (index N) with no animation
      setEnableTransition(false);
      setCurrentIndex(N);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
    }
  };
  const handleSponsorClick = (sp: typeof sponsorsList[0]) => {
    trackSponsor({
      sponsorId: sp.id,
      sponsorTitle: sp.title,
      category: sp.category,
      variant: 'card',
      targetUrl: sp.link,
    });
    if (sp.link.startsWith('tel:')) {
      trackCall({
        targetType: 'sponsor',
        targetId: sp.id,
        targetTitle: sp.title,
        phoneNumber: sp.link.replace('tel:', ''),
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (diff > 40) {
        handleNext();
      } else if (diff < -40) {
        handlePrev();
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };
  // Auto-play slow slide transition - loops forward endlessly
  useEffect(() => {
    if (isPaused || N <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, interval);
    return () => clearInterval(timer);
  }, [isPaused, N, interval, handleNext]);

  return (
    <aside
      aria-label={t('tp.aria')}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors overflow-hidden select-none"
    >
      {/* Static Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
          <span className="truncate">{currentSponsor.badgeText || t('spn.partnerPerk')}</span>
          <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
          <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">{currentSponsor.categoryLabel}</span>
        </div>

        {/* Right side: Navigation buttons + counter + Partner badge */}
        <div className="flex items-center gap-2 shrink-0">
          {sponsorsList.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition-colors rounded-none cursor-pointer"
                aria-label={t('spn.prev')}
                title={t('spn.prev')}
              >
                <span className="material-symbols-outlined text-[13px]">chevron_left</span>
              </button>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold px-0.5">
                {activeRealIndex + 1}/{sponsorsList.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition-colors rounded-none cursor-pointer"
                aria-label={t('spn.next')}
                title={t('spn.next')}
              >
                <span className="material-symbols-outlined text-[13px]">chevron_right</span>
              </button>
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-none border border-slate-200 dark:border-slate-700">
            {t('spn.partnerAd')}
          </span>
        </div>
      </div>

      {/* Sliding carousel body */}
      <div className="relative overflow-hidden w-full">
        <div
          className="flex"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: enableTransition ? 'transform 700ms ease-in-out' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((sp, idx) => {
            const isPhone = sp.link.startsWith('tel:');
            return (
              <div key={`${sp.id}-slide-${idx}`} className="w-full shrink-0 p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                {/* Left: Thumbnail / Logo & Details */}
                <div className="flex flex-col sm:flex-row gap-4 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="relative h-40 sm:h-28 sm:w-44 rounded-none overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                    <Image
                      src={sp.image}
                      alt={sp.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 180px"
                      className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 pointer-events-none md:hidden" />
                    <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-bold truncate md:hidden">
                      {sp.location}
                    </div>
                  </div>

                  {/* Texts */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center space-y-1.5">
                    <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{sp.location}</span>
                    </div>

                    <h3 className="font-title-card text-base sm:text-lg font-bold text-slate-950 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sp.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {sp.tagline}
                    </p>

                    {/* Discount Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold w-fit">
                      <Tag className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span className="truncate">{sp.discountText}</span>
                    </div>
                  </div>
                </div>

                {/* Right CTA Button */}
                <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 flex items-center justify-end">
                  <a
                    href={sp.link}
                    target={isPhone ? undefined : '_blank'}
                    rel={isPhone ? undefined : 'noopener noreferrer'}
                    onClick={() => handleSponsorClick(sp)}
                    className="w-full md:w-auto h-10 px-5 rounded-none bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-950 transition-colors active:scale-[0.98] cursor-pointer"
                  >
                    {isPhone ? (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>{t('spn.callClaim')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('spn.claimDiscount')}</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom indicator progress pills */}
      {sponsorsList.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          {sponsorsList.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleDotClick(i)}
              aria-label={t('spn.goTo', { n: i + 1 })}
              className={`h-1.5 transition-all rounded-none cursor-pointer ${
                i === activeRealIndex
                  ? 'w-6 bg-amber-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </aside>
  );
};
