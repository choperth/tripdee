'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

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

        {/* Partner Banner: Hotel & Resort Owners (Stitch Redesign) */}
        <div className="bg-gradient-to-r from-primary-container via-navy-deep to-navy-surface rounded-3xl p-space-lg lg:p-space-xl text-surface shadow-xl flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex items-center gap-space-md">
            <div className="w-14 h-14 rounded-2xl bg-surface/10 flex items-center justify-center text-[28px] shrink-0">
              🤝
            </div>
            <div className="space-y-space-2xs">
              <h4 className="font-headline-md text-headline-md text-surface">
                {t('show.bannerTitle')}
              </h4>
              <p className="font-body-base text-body-base text-surface-container-high opacity-90 max-w-2xl">
                {t('show.bannerDesc')}
              </p>
            </div>
          </div>
          <a
            href="https://line.me/R/ti/p/@tripdee"
            target="_blank"
            rel="noopener noreferrer"
            className="px-space-lg py-space-sm bg-line-green hover:bg-line-green-hover text-on-primary rounded-xl font-title-card text-title-card flex items-center gap-space-2xs shadow-md transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>{t('show.bannerCta')}</span>
          </a>
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
