'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SPONSORS } from '@/data/mockData';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';

export const SponsorSidebar: React.FC = () => {
  const { trackSponsor, trackCall, getSponsorClickCount } = useAnalytics();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

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

  const primarySponsor = SPONSORS[0]; // หมอกฟ้า พูลวิลล่า & แกลมปิ้ง ม่อนแจ่ม

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

      {/* 2. Verified Hotel & Resort Partner Sponsor (Stitch Redesign) */}
      {primarySponsor && (
        <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl overflow-hidden border border-border-subtle dark:border-slate-800 shadow-md hover:shadow-xl transition-all">
          <div className="relative h-44 w-full overflow-hidden bg-navy-deep">
            <Image
              src={primarySponsor.image}
              alt={primarySponsor.title}
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent pointer-events-none" />
            <span className="absolute top-3 left-3 px-space-xs py-space-2xs rounded bg-surface/90 text-navy-deep font-bold text-label-badge shadow-sm">
              {t('spn.hotelBadge')}
            </span>
            <span
              suppressHydrationWarning
              className="absolute bottom-2 right-2 rounded-md bg-navy-deep/80 px-2 py-0.5 text-[10px] font-bold text-surface backdrop-blur-xs"
            >
              {t('spn.clicks', { n: mounted ? getSponsorClickCount(primarySponsor.id) : 0 })}
            </span>
          </div>

          <div className="p-space-md space-y-space-xs">
            <div className="flex items-center gap-1 text-body-subtext font-body-subtext text-ink-muted dark:text-slate-400">
              <span className="material-symbols-outlined text-[14px] text-blue-action">
                location_on
              </span>
              <span>{primarySponsor.location}</span>
            </div>

            <h4 className="font-title-card text-title-card text-navy-deep dark:text-white line-clamp-2">
              {primarySponsor.title}
            </h4>

            <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300 line-clamp-2">
              {primarySponsor.tagline}
            </p>

            <div className="rounded-xl border border-dashed border-amber-accent/40 bg-taxi-yellow-soft dark:bg-amber-950/40 p-space-xs text-body-subtext font-bold text-on-tertiary-fixed-variant dark:text-amber-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-accent">
                loyalty
              </span>
              <span className="line-clamp-1">{primarySponsor.discountText}</span>
            </div>

            <a
              href={primarySponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSponsorClick(primarySponsor)}
              className="mt-space-xs w-full h-10 bg-navy-deep hover:bg-navy-surface text-surface rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>{t('sponsor.cta')}</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>
      )}

      {/* 3. Driver Vacancy Highlight Card */}
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
          {t('spn.vacTitle')}
        </h5>
        <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300">
          {t('spn.vacDesc')}
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
            href="https://line.me/R/ti/p/@tripdee"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 bg-line-green hover:bg-line-green-hover text-surface rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>{t('spn.adsAdvertise')}</span>
          </a>
          <a
            href="https://line.me/R/ti/p/@tripdee"
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
