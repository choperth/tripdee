'use client';

import React from 'react';
import Image from 'next/image';
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
  totalSuvDriverCount?: number;
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

  const applyQuickFilter = (type: 'yellow' | 'massage' | 'majesty' | 'tax' | 'suv7' | 'camry' | 'fortuner' | 'ecocar') => {
    if (type === 'yellow') {
      if (setPlateFilter) setPlateFilter('yellow');
    } else if (type === 'massage') {
      setSelectedSeats('9');
      // Data keyword: vehicle data is in Thai, so the filter value stays Thai in every locale.
      setSearchKeyword(t('hero.quickMassage'));
    } else if (type === 'majesty') {
      setSearchKeyword('Majesty');
    } else if (type === 'tax') {
      if (setPlateFilter) setPlateFilter('tax');
    } else if (type === 'suv7') {
      setSelectedSeats('7');
      setSearchKeyword('');
    } else if (type === 'camry') {
      setSearchKeyword('Camry');
    } else if (type === 'fortuner') {
      setSearchKeyword('Fortuner');
    } else if (type === 'ecocar') {
      setSearchKeyword('Eco');
    }
    scrollToResults();
  };

  return (
    <section aria-label={t('hero.searchAria')} className="relative w-full overflow-hidden bg-paper-canvas dark:bg-slate-950 pt-3 sm:pt-8 pb-3 sm:pb-10 transition-colors">
      {/* Subtle Ambient Backdrop Circles (Stitch Signature) */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-surface-variant/40 dark:bg-blue-900/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-24 w-96 h-96 rounded-full bg-taxi-yellow-soft/80 dark:bg-amber-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-margin lg:px-gutter relative z-10">
        {/* Top Title Group */}
        <div className="text-center max-w-3xl mx-auto space-y-1 sm:space-y-space-sm mb-2.5 sm:mb-space-xl">
          <h1 className="font-display-hero text-display-hero text-navy-deep dark:text-white tracking-tight">
            {t('hero.titleA')} <span className="text-blue-action">{t('hero.titleB')}</span>
          </h1>
          <p className="font-body-large text-xs sm:text-body-large text-ink-secondary dark:text-slate-300">
            {t('hero.subtitle')}
          </p>

          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-space-md pt-0.5 sm:pt-space-xs">
            <div className="flex items-center gap-1 text-ink-primary dark:text-slate-200 font-bold text-[11px] sm:text-body-medium bg-paper-elevated dark:bg-slate-900 px-2.5 py-1 sm:px-space-sm sm:py-space-2xs rounded-full shadow-2xs border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-verified-emerald text-[16px] sm:text-[18px]">
                check_circle
              </span>
              <span>{t('hero.trust1')}</span>
            </div>
            <div className="flex items-center gap-1 text-ink-primary dark:text-slate-200 font-bold text-[11px] sm:text-body-medium bg-paper-elevated dark:bg-slate-900 px-2.5 py-1 sm:px-space-sm sm:py-space-2xs rounded-full shadow-2xs border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-blue-action text-[16px] sm:text-[18px]">
                ring_volume
              </span>
              <span>{t('hero.trust2')}</span>
            </div>
            <div className="flex items-center gap-1 text-ink-primary dark:text-slate-200 font-bold text-[11px] sm:text-body-medium bg-paper-elevated dark:bg-slate-900 px-2.5 py-1 sm:px-space-sm sm:py-space-2xs rounded-full shadow-2xs border border-border-subtle dark:border-slate-800">
              <span className="material-symbols-outlined text-amber-accent text-[16px] sm:text-[18px]">
                receipt_long
              </span>
              <span>{t('hero.trust3')}</span>
            </div>
          </div>
        </div>

        {/* Advanced Integrated Floating Search Console (Stitch Redesign) */}
        <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl shadow-xl border border-border-subtle dark:border-slate-800 p-3 sm:p-space-md lg:p-space-lg max-w-5xl mx-auto mb-3 sm:mb-8">
          {/* Search Category Sub-Tabs */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1.5 mb-2 sm:mb-space-sm no-scrollbar text-body-subtext font-body-medium">
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
              onClick={() => handleTabChange('suv_driver')}
              className={`px-space-md py-space-xs rounded-lg font-bold shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all ${
                activeTab === 'suv_driver'
                  ? 'bg-navy-deep text-on-primary'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              <span>{t('nav.suvDriver')}</span>
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
              <span className="material-symbols-outlined text-[16px]">key</span>
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
            {activeTab === 'suv_driver' ? (
              <>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('suv7')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickSuv7')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('fortuner')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickFortuner')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('camry')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickCamry')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('tax')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickTax')}
                </button>
              </>
            ) : activeTab === 'car' ? (
              <>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('ecocar')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  Eco Car
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('suv7')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickSuv7')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('tax')}
                  className="px-space-xs py-space-2xs rounded-full bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant dark:hover:bg-slate-700 transition-colors"
                >
                  {t('hero.quickTax')}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Hero Visual Panorama Display Banner */}
        <div
          role="button"
          tabIndex={0}
          onClick={scrollToResults}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToResults();
            }
          }}
          className="hidden sm:block relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-border-subtle dark:border-slate-800 group cursor-pointer bg-navy-deep transition-transform duration-200 active:scale-[0.99]"
          title={t('hero.imageTitle')}
        >
          <Image
            src="/hero-banner.png"
            alt={t('hero.imageAlt')}
            width={1024}
            height={381}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    </section>
  );
};
