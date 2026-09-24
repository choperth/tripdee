'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { OFFICIAL_LINE_URL } from '@/lib/constants';

interface PlatformShowcaseProps {
  onOpenRegister?: () => void;
  onSelectCorporate?: () => void;
  onScrollToSearch?: () => void;
}

export const PlatformShowcase: React.FC<PlatformShowcaseProps> = ({
  onOpenRegister,
  onSelectCorporate,
  onScrollToSearch,
}) => {
  const { t } = useLanguage();

  return (
    <section aria-label={t('show.title')} className="w-full py-space-3xl bg-paper-canvas dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* Platform Header (Stitch Redesign) */}
        <div className="text-center max-w-2xl mx-auto space-y-space-xs mb-space-2xl">
          <h2 className="font-headline-xl text-headline-xl text-navy-deep dark:text-white tracking-tight">
            {t('show.title')}
          </h2>
          <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300">
            {t('show.subtitle')}
          </p>
        </div>

        {/* 3 Strategic Feature Cards (Stitch 3-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {/* Feature 1: 0% Commission */}
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-lg shadow-md hover:shadow-xl border border-border-subtle dark:border-slate-800 transition-all flex flex-col justify-between space-y-space-md">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-subtle text-blue-action dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">percent</span>
                </div>
                <span className="px-space-xs py-space-2xs rounded-full bg-verified-emerald-soft text-verified-emerald font-bold text-label-badge">
                  {t('show.badgeZero')}
                </span>
              </div>
              <h3 className="font-title-card text-title-card text-navy-deep dark:text-white">
                {t('show.card1Title')}
              </h3>
              <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300">
                {t('show.card1Desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full h-10 bg-blue-action hover:bg-blue-action-hover text-on-primary rounded-xl font-body-medium text-body-medium transition-all shadow-sm cursor-pointer"
            >
              {t('show.card1Cta')}
            </button>
          </div>

          {/* Feature 2: Corporate Caravan & Tax Invoices */}
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-lg shadow-md hover:shadow-xl border border-border-subtle dark:border-slate-800 transition-all flex flex-col justify-between space-y-space-md">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-taxi-yellow-soft text-on-tertiary-container dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                </div>
                <span className="px-space-xs py-space-2xs rounded-full bg-taxi-yellow-soft text-on-tertiary-container dark:bg-amber-950/70 dark:text-amber-300 font-bold text-label-badge border border-amber-300/40">
                  {t('show.badgeTax')}
                </span>
              </div>
              <h3 className="font-title-card text-title-card text-navy-deep dark:text-white">
                {t('show.card2Title')}
              </h3>
              <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300">
                {t('show.card2Desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSelectCorporate) {
                  onSelectCorporate();
                } else {
                  document.getElementById('corporate')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full h-10 bg-paper-surface-muted dark:bg-slate-800 hover:bg-surface-variant dark:hover:bg-slate-700 text-navy-deep dark:text-white rounded-xl font-body-medium text-body-medium transition-all shadow-sm cursor-pointer"
            >
              {t('show.card2Cta')}
            </button>
          </div>

          {/* Feature 3: Verified & Safe Deal Direct */}
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-lg shadow-md hover:shadow-xl border border-border-subtle dark:border-slate-800 transition-all flex flex-col justify-between space-y-space-md">
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-verified-emerald-soft text-verified-emerald dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">verified_user</span>
                </div>
                <span className="px-space-xs py-space-2xs rounded-full bg-verified-emerald-soft text-verified-emerald dark:bg-emerald-950/70 dark:text-emerald-300 font-bold text-label-badge">
                  {t('hero.verifiedSticker')}
                </span>
              </div>
              <h3 className="font-title-card text-title-card text-navy-deep dark:text-white">
                {t('show.card3Title')}
              </h3>
              <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300">
                {t('show.card3Desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onScrollToSearch) {
                  onScrollToSearch();
                } else {
                  document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full h-10 bg-paper-surface-muted dark:bg-slate-800 hover:bg-surface-variant dark:hover:bg-slate-700 text-navy-deep dark:text-white rounded-xl font-body-medium text-body-medium transition-all shadow-sm cursor-pointer"
            >
              {t('show.card3Cta')}
            </button>
          </div>
        </div>

        {/* Partner Banner: Hotel & Resort Owners (Balanced Stitch Card) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-container via-navy-deep to-navy-surface rounded-3xl p-5 sm:p-7 lg:p-9 text-surface shadow-xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          {/* Subtle background atmosphere */}
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Left content: Icon + Title + Description */}
          <div className="relative z-10 flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-2xl sm:text-[28px] shrink-0 border border-white/10 shadow-xs">
              🤝
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-headline-md text-base sm:text-lg lg:text-xl font-bold text-surface tracking-tight leading-snug">
                {t('show.bannerTitle')}
              </h4>
              <p className="font-body-base text-xs sm:text-sm text-surface-container-high/90 max-w-2xl leading-relaxed">
                {t('show.bannerDesc')}
              </p>
            </div>
          </div>

          {/* Right content: Refined Balanced LINE CTA */}
          <div className="relative z-10 shrink-0 w-full sm:w-auto flex items-center">
            <a
              href={OFFICIAL_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white shadow-md hover:shadow-lg shadow-emerald-950/25 transition-all duration-200 active:scale-[0.98] border border-emerald-400/30 font-body-medium text-sm sm:text-base cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[17px] text-white">chat</span>
              </div>
              <span className="font-bold tracking-tight whitespace-nowrap">
                {t('show.bannerCtaAction')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black/15 text-white/95 shrink-0 border border-white/15 whitespace-nowrap">
                {t('show.bannerCtaBadge')}
              </span>
            </a>
          </div>
        </div>

        {/* SEO Footnote Reference Directory (Stitch Redesign) */}
        <div className="mt-space-2xl grid grid-cols-1 md:grid-cols-2 gap-space-lg bg-paper-elevated dark:bg-slate-900 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-800 shadow-sm text-body-subtext">
          <div>
            <h5 className="font-title-card text-title-card text-navy-deep dark:text-white mb-space-xs">
              {t('home.servicesTitle')}
            </h5>
            <ul className="space-y-1 text-ink-secondary dark:text-slate-300">
              <li>• {t('home.service1')}</li>
              <li>• {t('home.service2')}</li>
              <li>• {t('home.service3')}</li>
              <li>• {t('home.service4')}</li>
              <li>• {t('home.service5')}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-title-card text-title-card text-navy-deep dark:text-white mb-space-xs">
              {t('home.routesRecTitle')}
            </h5>
            <ul className="space-y-1 text-ink-secondary dark:text-slate-300">
              <li>• {t('home.routeLink1')}</li>
              <li>• {t('home.routeLink2')}</li>
              <li>• {t('home.routeLink3')}</li>
              <li>• {t('home.routeLink4')}</li>
              <li>• {t('home.routeLink5')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
