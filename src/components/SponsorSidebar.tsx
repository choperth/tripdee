'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SPONSORS, BoardPost } from '@/data/mockData';
import { isMockDataEnabled, isMockPostId } from '@/lib/mockConfig';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';

export const SponsorSidebar: React.FC = () => {
  const { trackSponsor, trackCall, getSponsorClickCount } = useAnalytics();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const isDemo = mounted && isMockDataEnabled();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const handleSponsorClick = (sponsor: typeof SPONSORS[0]) => {
    trackSponsor({
      sponsorId: sponsor.id,
      sponsorTitle: sponsor.title,
      category: sponsor.category,
      variant: 'sidebar',
      targetUrl: sponsor.link,
    });
    if (sponsor.link.startsWith('tel:')) {
      trackCall({
        targetType: 'sponsor',
        targetId: sponsor.id,
        targetTitle: sponsor.title,
        phoneNumber: sponsor.link.replace('tel:', ''),
      });
    }
  };

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [liveVacancyPost, setLiveVacancyPost] = useState<BoardPost | null>(null);

  useEffect(() => {
    const fetchLatestDemand = () => {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      fetch('/api/board' + search)
        .then((res) => res.json())
        .then((data) => {
          if (data.posts && Array.isArray(data.posts)) {
            const demands = data.posts.filter((p: BoardPost) => {
              if (p.type !== 'request' && p.type !== 'share') return false;
              if (!isDemo && isMockPostId(p.id)) return false;
              return true;
            });
            setLiveVacancyPost(demands.length > 0 ? demands[0] : null);
          }
        })
        .catch(() => {});
    };

    fetchLatestDemand();
    window.addEventListener('tripdee-board-updated', fetchLatestDemand);
    return () => window.removeEventListener('tripdee-board-updated', fetchLatestDemand);
  }, [isDemo]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % SPONSORS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeSponsor = SPONSORS[selectedIdx] || SPONSORS[0];

  return (
    <aside aria-label={t('spn.aria')} className="space-y-space-lg">
      {/* 1. Quick Hub Navigation Card (Stitch Redesign) */}
      <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-md border border-border-subtle dark:border-slate-800 shadow-sm space-y-space-sm">
        <div className="flex items-center gap-space-2xs text-navy-deep dark:text-white font-title-card text-title-card">
          <span className="material-symbols-outlined text-blue-action text-[20px]">
            recommend
          </span>
          <span>{t('spn.hubTitle')}</span>
        </div>
        <div className="space-y-space-xs text-body-subtext font-body-medium">
          <button
            type="button"
            onClick={() => {
              document.getElementById('corporate')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-between p-space-xs rounded-xl bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 hover:bg-blue-subtle dark:hover:bg-blue-950/50 hover:text-blue-action transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[18px] text-amber-accent">
                corporate_fare
              </span>
              <span>{t('spn.hubCorp')}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-ink-muted">
              chevron_right
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-between p-space-xs rounded-xl bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 hover:bg-blue-subtle dark:hover:bg-blue-950/50 hover:text-blue-action transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[18px] text-blue-action">
                airline_seat_recline_extra
              </span>
              <span>{t('spn.hubVan')}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-ink-muted">
              chevron_right
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              document.getElementById('tripboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-between p-space-xs rounded-xl bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 hover:bg-blue-subtle dark:hover:bg-blue-950/50 hover:text-blue-action transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[18px] text-line-green">
                local_taxi
              </span>
              <span>{t('spn.hubBoard')}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-ink-muted">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Sponsor Partner Showcase (Interactive & Auto-Rotating) */}
      {isDemo && activeSponsor && (
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="bg-paper-elevated dark:bg-slate-900 rounded-2xl overflow-hidden border border-border-subtle dark:border-slate-800 shadow-md hover:shadow-xl transition-all"
        >
          {/* Sponsor Category Switcher Tabs */}
          <div className="grid grid-cols-6 gap-1 p-1.5 sm:p-2 bg-paper-surface-muted dark:bg-slate-800 border-b border-border-subtle dark:border-slate-700/60">
            {SPONSORS.map((s, idx) => {
              const isActive = idx === selectedIdx;
              const icon =
                s.category === 'hotel'
                  ? 'bed'
                  : s.category === 'insurance'
                  ? 'shield'
                  : s.category === 'fuel'
                  ? 'local_gas_station'
                  : s.category === 'activity'
                  ? 'pets'
                  : s.category === 'restaurant'
                  ? 'restaurant'
                  : s.category === 'tour'
                  ? 'map'
                  : 'build';
              const label =
                s.category === 'hotel'
                  ? 'ที่พัก'
                  : s.category === 'insurance'
                  ? 'ประกัน'
                  : s.category === 'fuel'
                  ? 'น้ำมัน'
                  : s.category === 'activity'
                  ? 'ปางช้าง'
                  : s.category === 'restaurant'
                  ? 'ร้านอาหาร'
                  : s.category === 'tour'
                  ? 'ทัวร์'
                  : 'อู่รถ';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedIdx(idx);
                    setIsPaused(true);
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-navy-deep text-white shadow-xs dark:bg-blue-600'
                      : 'text-ink-muted hover:text-navy-deep dark:text-slate-400 dark:hover:text-white'
                  }`}
                  aria-label={`ดูสิทธิพิเศษ ${s.title}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  <span className="text-[10px] truncate leading-tight mt-0.5">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative h-44 w-full overflow-hidden bg-navy-deep">
            <Image
              key={activeSponsor.id}
              src={activeSponsor.image}
              alt={activeSponsor.title}
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent pointer-events-none" />
            <span className="absolute top-3 left-3 px-space-xs py-space-2xs rounded bg-surface/90 text-navy-deep font-bold text-label-badge shadow-sm">
              {activeSponsor.categoryLabel}
            </span>
            <span
              suppressHydrationWarning
              className="absolute bottom-2 right-2 rounded-md bg-navy-deep/80 px-2 py-0.5 text-[10px] font-bold text-surface backdrop-blur-xs"
            >
              {t('spn.clicks', { n: mounted ? getSponsorClickCount(activeSponsor.id) : 0 })}
            </span>
          </div>

          <div className="p-space-md space-y-space-xs">
            <div className="flex items-center gap-1 text-body-subtext font-body-subtext text-ink-muted dark:text-slate-400">
              <span className="material-symbols-outlined text-[14px] text-blue-action">
                location_on
              </span>
              <span className="truncate">{activeSponsor.location}</span>
            </div>

            <h4 className="font-title-card text-title-card text-navy-deep dark:text-white line-clamp-2">
              {activeSponsor.title}
            </h4>

            <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300 line-clamp-2">
              {activeSponsor.tagline}
            </p>

            <div className="rounded-xl border border-dashed border-amber-accent/40 bg-taxi-yellow-soft dark:bg-amber-950/40 p-space-xs text-body-subtext font-bold text-on-tertiary-fixed-variant dark:text-amber-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-accent shrink-0">
                loyalty
              </span>
              <span className="line-clamp-1">{activeSponsor.discountText}</span>
            </div>

            <a
              href={activeSponsor.link}
              target={activeSponsor.link.startsWith('tel:') ? undefined : '_blank'}
              rel={activeSponsor.link.startsWith('tel:') ? undefined : 'noopener noreferrer'}
              onClick={() => handleSponsorClick(activeSponsor)}
              className="mt-space-xs w-full h-10 bg-navy-deep hover:bg-navy-surface text-surface rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>{activeSponsor.link.startsWith('tel:') ? 'โทรรับสิทธิ์' : t('sponsor.cta')}</span>
              <span className="material-symbols-outlined text-[16px]">
                {activeSponsor.link.startsWith('tel:') ? 'call' : 'open_in_new'}
              </span>
            </a>
          </div>
        </div>
      )}

      {/* 3. Driver Vacancy Highlight Card */}
      {(liveVacancyPost || isDemo) && (
        <div className="bg-paper-canvas dark:bg-slate-900/60 rounded-2xl p-space-md border border-border-subtle dark:border-slate-800 space-y-space-xs">
          <div className="flex items-center justify-between">
            <span className="px-space-xs py-space-2xs rounded bg-verified-emerald-soft text-verified-emerald font-bold text-label-badge">
              {t('spn.vacBadge')}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-verified-emerald opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verified-emerald" />
            </span>
          </div>
          <h5 className="font-title-card text-title-card text-navy-deep dark:text-white">
            {liveVacancyPost ? liveVacancyPost.title : t('spn.vacTitle')}
          </h5>
          <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300">
            {liveVacancyPost
              ? `${liveVacancyPost.type === 'share' ? '🤝 ' : ''}${liveVacancyPost.authorName} ${
                  liveVacancyPost.date ? `• ${liveVacancyPost.date}` : ''
                } ${liveVacancyPost.priceNote ? `• ${liveVacancyPost.priceNote}` : ''} ${
                  liveVacancyPost.price > 0 ? `• ฿${liveVacancyPost.price.toLocaleString()}` : ''
                }`
              : t('spn.vacDesc')}
          </p>
          <button
            type="button"
            onClick={() => {
              document.getElementById('tripboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full mt-1 text-center text-body-subtext font-bold text-blue-action hover:underline cursor-pointer"
          >
            {t('spn.vacCta')}
          </button>
        </div>
      )}

      {/* 4. Package Stats & Advertising (Stitch Redesign Card) */}
      <div className="bg-gradient-to-br from-primary-container to-navy-surface text-surface rounded-2xl p-space-md space-y-space-sm shadow-md">
        <div className="space-y-space-2xs">
          <span className="font-label-badge text-label-badge text-taxi-yellow-30 uppercase tracking-wider">
            Sponsorship & Ads
          </span>
          <h4 className="font-title-card text-title-card text-surface">
            {t('spn.adsTitle')}
          </h4>
          <p className="font-body-subtext text-body-subtext text-surface-container-high opacity-90">
            {t('spn.adsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-space-xs pt-space-2xs">
          <a
            href="https://line.me/R/ti/p/@731ruvzj"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 bg-line-green hover:bg-line-green-hover text-surface rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>{t('spn.adsAdvertise')}</span>
          </a>
          <a
            href="https://line.me/R/ti/p/@731ruvzj"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 bg-surface/20 hover:bg-surface/30 text-surface rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 transition-all"
          >
            <span>{t('spn.adsStats')}</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
