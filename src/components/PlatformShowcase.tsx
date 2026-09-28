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
    <section aria-label={t('show.title')} className="w-full py-8 md:py-16 bg-paper dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* Asymmetric Platform Showcase (Replaces banned 3-equal feature cards) */}
        <div className="hidden md:grid md:grid-cols-12 gap-6 mb-12 items-stretch">
          {/* Left Column: Authoritative Platform Mission Card (5 of 12) */}
          <div className="md:col-span-5 bg-navy-deep text-white rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-xs border border-navy-surface">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
                <span className="material-symbols-outlined text-[15px] text-verified-emerald">check_circle</span>
                <span>{t('show.badgeZero')}</span>
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
                {t('show.title')}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t('show.subtitle')}
              </p>
            </div>
            <div className="pt-6">
              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center justify-center gap-2 w-full h-11 bg-white text-navy-deep hover:bg-slate-100 rounded-xl font-bold text-sm transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span>{t('show.card1Cta')}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Right Column: 2 Asymmetric Feature Highlights (7 of 12) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4">
            {/* Feature 1: Corporate Caravan & Billing */}
            <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-5 lg:p-6 border border-border-subtle dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </span>
                  <h3 className="font-bold text-base text-navy-deep dark:text-white">
                    {t('show.card2Title')}
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary dark:text-slate-400 leading-relaxed pl-10">
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
                className="shrink-0 px-4 py-2 bg-paper-surface-muted dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-navy-deep dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-border-subtle dark:border-slate-700"
              >
                {t('show.card2Cta')}
              </button>
            </div>

            {/* Feature 2: Verified Driver Network & Direct Deal */}
            <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-5 lg:p-6 border border-border-subtle dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </span>
                  <h3 className="font-bold text-base text-navy-deep dark:text-white">
                    {t('show.card3Title')}
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary dark:text-slate-400 leading-relaxed pl-10">
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
                className="shrink-0 px-4 py-2 bg-paper-surface-muted dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-navy-deep dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-border-subtle dark:border-slate-700"
              >
                {t('show.card3Cta')}
              </button>
            </div>
          </div>
        </div>

        {/* Partner Banner: Hotel & Resort Owners (Clean, crisp, no glowing blobs) */}
        <div className="bg-navy-deep dark:bg-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-xs border border-navy-surface dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0 border border-white/10">
              🤝
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-bold text-base sm:text-lg text-white tracking-tight leading-snug">
                {t('show.bannerTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {t('show.bannerDesc')}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex items-center">
            <a
              href={OFFICIAL_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b04b] text-white shadow-xs transition-all active:scale-[0.98] font-bold text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">chat</span>
              <span className="whitespace-nowrap">{t('show.bannerCtaAction')}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/15 text-white/95">
                {t('show.bannerCtaBadge')}
              </span>
            </a>
          </div>
        </div>

        {/* SEO Footnote Reference Directory */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-paper-elevated dark:bg-slate-900 p-5 rounded-xl border border-border-subtle dark:border-slate-800 text-xs">
          <div>
            <h5 className="font-bold text-xs text-navy-deep dark:text-white uppercase tracking-wider mb-2">
              {t('home.servicesTitle')}
            </h5>
            <ul className="space-y-1 text-ink-secondary dark:text-slate-400">
              <li>• {t('home.service1')}</li>
              <li>• {t('home.service2')}</li>
              <li>• {t('home.service3')}</li>
              <li>• {t('home.service4')}</li>
              <li>• {t('home.service5')}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-xs text-navy-deep dark:text-white uppercase tracking-wider mb-2">
              {t('home.routesRecTitle')}
            </h5>
            <ul className="space-y-1 text-ink-secondary dark:text-slate-400">
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
