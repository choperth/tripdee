'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  selectedSeats: string;
  setSelectedSeats: (seats: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  resultCount: number;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  plateFilter?: 'all' | 'yellow' | 'blue' | 'tax';
  setPlateFilter?: (filter: 'all' | 'yellow' | 'blue' | 'tax') => void;
  totalVanCount?: number;
  totalCarCount?: number;
}

export const Hero: React.FC<HeroProps> = ({
  selectedZone,
  setSelectedZone,
  selectedSeats,
  setSelectedSeats,
  searchKeyword,
  setSearchKeyword,
  resultCount,
  activeTab = 'van',
  setActiveTab,
  setPlateFilter,
}) => {
  const { t } = useLanguage();

  const scrollToResults = () => {
    document.getElementById('results')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleTabChange = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (tab === 'corporate') {
      document.getElementById('corporate')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      scrollToResults();
    }
  };

  const applyQuickFilter = (type: 'yellow' | 'massage' | 'majesty' | 'tax') => {
    if (type === 'yellow') {
      if (setPlateFilter) setPlateFilter('yellow');
    } else if (type === 'massage') {
      setSelectedSeats('9');
      // Data keyword: vehicle data is in Thai, so the filter value stays Thai in every locale.
      setSearchKeyword('เบาะนวด');
    } else if (type === 'majesty') {
      setSearchKeyword('Majesty');
    } else if (type === 'tax') {
      if (setPlateFilter) setPlateFilter('tax');
    }
    scrollToResults();
  };

  return (
    <section aria-label={t('hero.searchAria')} className="relative w-full overflow-hidden bg-paper-canvas dark:bg-slate-950 pt-24 sm:pt-28 pb-12 sm:pb-16 transition-colors">
      {/* Subtle Ambient Backdrop Circles (Stitch Signature) */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-surface-variant/40 dark:bg-blue-900/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-24 w-96 h-96 rounded-full bg-taxi-yellow-soft/80 dark:bg-amber-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-margin lg:px-gutter relative z-10">
        {/* Top Title Group */}
        <div className="text-center max-w-3xl mx-auto space-y-space-sm mb-space-xl">
          <h1 className="font-display-hero text-display-hero text-navy-deep dark:text-white tracking-tight">
            {t('hero.titleA')} <span className="text-blue-action">{t('hero.titleB')}</span>
          </h1>
          <p className="font-body-large text-body-large text-ink-secondary dark:text-slate-300">
            {t('hero.subtitle')}
          </p>

          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-space-sm sm:gap-space-md pt-space-xs">
            <div className="flex items-center gap-space-2xs text-ink-primary dark:text-slate-200 font-body-medium text-body-medium bg-paper-elevated dark:bg-slate-900 px-space-sm py-space-2xs rounded-full shadow-sm border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-verified-emerald text-[18px]">
                check_circle
              </span>
              <span>{t('hero.trust1')}</span>
            </div>
            <div className="flex items-center gap-space-2xs text-ink-primary dark:text-slate-200 font-body-medium text-body-medium bg-paper-elevated dark:bg-slate-900 px-space-sm py-space-2xs rounded-full shadow-sm border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-blue-action text-[18px]">
                ring_volume
              </span>
              <span>{t('hero.trust2')}</span>
            </div>
            <div className="flex items-center gap-space-2xs text-ink-primary dark:text-slate-200 font-body-medium text-body-medium bg-paper-elevated dark:bg-slate-900 px-space-sm py-space-2xs rounded-full shadow-sm border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-amber-accent text-[18px]">
                receipt_long
              </span>
              <span>{t('hero.trust3')}</span>
            </div>
          </div>
        </div>

        {/* Advanced Integrated Floating Search Console (Stitch Redesign) */}
        <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl shadow-xl border border-border-subtle dark:border-slate-800 p-space-md lg:p-space-lg max-w-5xl mx-auto mb-space-2xl">
          {/* Search Category Sub-Tabs */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm mb-space-sm no-scrollbar text-body-subtext font-body-medium">
            <button
              type="button"
              onClick={() => handleTabChange('van')}
              className={`px-space-md py-space-xs rounded-lg font-bold shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all ${
                activeTab === 'van'
                  ? 'bg-navy-deep text-on-primary'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">airport_shuttle</span>
              <span>{t('nav.van')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('car')}
              className={`px-space-md py-space-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-space-2xs transition-all ${
                activeTab === 'car'
                  ? 'bg-navy-deep text-on-primary shadow-sm'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              <span>{t('nav.car')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('hotel')}
              className={`px-space-md py-space-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-space-2xs transition-all ${
                activeTab === 'hotel'
                  ? 'bg-navy-deep text-on-primary shadow-sm'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">hotel</span>
              <span>{t('nav.hotel')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('corporate')}
              className={`px-space-md py-space-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-space-2xs transition-all ${
                activeTab === 'corporate'
                  ? 'bg-navy-deep text-on-primary shadow-sm'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
              <span>{t('nav.corp')}</span>
            </button>
          </div>

          {/* Form Filter Fields */}
          <form
            className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-end"
            id="hero-search-form"
            aria-label={t('hero.filterAria')}
            onSubmit={(e) => {
              e.preventDefault();
              scrollToResults();
            }}
          >
            {/* 1: Destination */}
            <div className="md:col-span-4 space-y-space-2xs">
              <label htmlFor="destination-select" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                {t('hero.zoneLabel')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-[20px]">
                  location_on
                </span>
                <select
                  id="destination-select"
                  aria-label={t('hero.zoneLabel')}
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    scrollToResults();
                  }}
                  className="w-full h-11 pl-10 pr-8 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-ink-primary font-body-base text-body-base appearance-none focus:outline-none focus:bg-paper-elevated dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-action border border-transparent focus:border-blue-action transition-all cursor-pointer"
                >
                  <option value="all">{t('hero.zoneAll')}</option>
                  <option value="central">{t('hero.zoneBkk')}</option>
                  <option value="north">{t('hero.zoneNorth')}</option>
                  <option value="east">{t('hero.zoneEast')}</option>
                  <option value="south">{t('hero.zoneSouth')}</option>
                  <option value="isan">{t('hero.zoneIsan')}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* 2: Passenger Count */}
            <div className="md:col-span-3 space-y-space-2xs">
              <label htmlFor="passengers-select" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                {t('hero.seatsLabel')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-[20px]">
                  group
                </span>
                <select
                  id="passengers-select"
                  aria-label={t('hero.seatsLabel')}
                  value={selectedSeats}
                  onChange={(e) => {
                    setSelectedSeats(e.target.value);
                    scrollToResults();
                  }}
                  className="w-full h-11 pl-10 pr-8 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-ink-primary font-body-base text-body-base appearance-none focus:outline-none focus:bg-paper-elevated dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-action border border-transparent focus:border-blue-action transition-all cursor-pointer"
                >
                  <option value="all">{t('hero.seatsAll')}</option>
                  <option value="4-5">{t('hero.seats45')}</option>
                  <option value="7">{t('hero.seats7')}</option>
                  <option value="9">{t('hero.seats9')}</option>
                  <option value="10">{t('hero.seats10')}</option>
                  <option value="11-14">{t('hero.seats11')}</option>
                  <option value="16-24">{t('hero.seats16')}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* 3: Special Specs / Keywords */}
            <div className="md:col-span-3 space-y-space-2xs">
              <label htmlFor="search-keyword-input" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                {t('hero.keywordLabel')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-[20px]">
                  tune
                </span>
                <input
                  id="search-keyword-input"
                  aria-label={t('hero.keywordLabel')}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={t('hero.keywordPh')}
                  className="w-full h-11 pl-10 pr-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-ink-primary font-body-base text-body-base focus:outline-none focus:bg-paper-elevated dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-action border border-transparent focus:border-blue-action transition-all"
                />
              </div>
            </div>

            {/* 4: Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                onClick={scrollToResults}
                className="w-full h-11 bg-blue-action hover:bg-blue-action-hover text-on-primary font-title-card text-title-card rounded-xl flex items-center justify-center gap-space-2xs shadow-md transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>{t('hero.searchBtn', { count: resultCount })}</span>
              </button>
            </div>
          </form>

          {/* Quick filter chips underneath */}
          <div className="flex items-center gap-space-xs mt-space-sm pt-space-xs flex-wrap text-body-subtext">
            <span className="text-ink-muted dark:text-slate-400 font-body-subtext">{t('hero.quickTitle')}</span>
            <button
              type="button"
              onClick={() => applyQuickFilter('yellow')}
              className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
            >
              {t('hero.quickYellow')}
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('massage')}
              className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
            >
              {t('hero.quickMassage')}
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('majesty')}
              className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
            >
              Toyota Majesty
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('tax')}
              className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
            >
              {t('hero.quickTax')}
            </button>
          </div>
        </div>

        {/* Hero Visual Panorama Display Banner (Stitch Showcase) */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-navy-deep">
          <div
            className="w-full h-72 sm:h-96 lg:h-[400px] bg-cover bg-center relative"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85")',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 p-space-lg lg:p-space-xl flex flex-col sm:flex-row items-start sm:items-end justify-between gap-space-md text-surface">
              <div className="space-y-space-2xs max-w-2xl">
                <div className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-verified-emerald text-on-primary font-label-badge text-label-badge shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>{t('hero.verifiedSticker')}</span>
                </div>
                <h2 className="font-headline-xl text-headline-xl text-surface">
                  {t('hero.photoCaption')}
                </h2>
                <p className="font-body-base text-body-base text-surface-container-high opacity-90">
                  {t('hero.fleetDesc')}
                </p>
              </div>

              <div className="flex items-center gap-space-sm bg-navy-deep/85 backdrop-blur-md p-space-sm rounded-2xl border border-white/10 shadow-lg shrink-0">
                <div className="text-right">
                  <div className="font-label-badge text-label-badge text-taxi-yellow-30 uppercase">
                    {t('hero.ready')}
                  </div>
                  <div className="font-headline-md text-headline-md text-surface">
                    {t('hero.coverage')}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-action flex items-center justify-center text-on-primary shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
