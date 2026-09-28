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
    <section
      aria-label={t('hero.searchAria')}
      className="relative w-full bg-[#0a192f] text-white pt-8 sm:pt-10 pb-12 sm:pb-16 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Tagline & Minimal Trust Badges */}
        <div className="max-w-3xl mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-3">
            {t('hero.titleA')}{' '}
            <span className="text-amber-400 border-b-2 border-amber-400">{t('hero.titleB')}</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            {t('hero.subtitle')}
          </p>

          {/* 3 Sharp Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1">
              <span className="material-symbols-outlined text-emerald-400 text-[15px]">verified_user</span>
              <span>{t('hero.trust1')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1">
              <span className="material-symbols-outlined text-amber-400 text-[15px]">security</span>
              <span>{t('hero.trust2')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1">
              <span className="material-symbols-outlined text-sky-400 text-[15px]">receipt</span>
              <span>{t('hero.trust3')}</span>
            </div>
          </div>
        </div>

        {/* SHARP GEOMETRIC SEARCH CONTAINER (Bauhaus Swiss Grid) */}
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm rounded-none">
          {/* Sharp Category Service Tabs */}
          <div className="flex items-stretch overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50" id="search-tabs">
            <button
              type="button"
              onClick={() => handleTabChange('van')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-bold text-xs border-r border-slate-200 dark:border-slate-800 transition-all shrink-0 cursor-pointer ${
                activeTab === 'van'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-t-2 border-t-slate-950 dark:border-t-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">airport_shuttle</span>
              <span>{t('nav.van')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('suv_driver')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs border-r border-slate-200 dark:border-slate-800 transition-all shrink-0 cursor-pointer ${
                activeTab === 'suv_driver'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-t-2 border-t-slate-950 dark:border-t-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span>{t('nav.suvDriverShort')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('car')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs border-r border-slate-200 dark:border-slate-800 transition-all shrink-0 cursor-pointer ${
                activeTab === 'car'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-t-2 border-t-slate-950 dark:border-t-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>{t('nav.car')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('corporate')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs border-r border-slate-200 dark:border-slate-800 transition-all shrink-0 cursor-pointer ${
                activeTab === 'corporate'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-t-2 border-t-slate-950 dark:border-t-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
              <span>{t('nav.corp')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('tripboard')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
              <span>TripBoard หางาน / แชร์ทริป</span>
            </button>
          </div>

          {/* Sharp Connected Form Grid (Zero rounded inputs, 1px precision dividers) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              scrollToResults();
            }}
            className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800"
          >
            {/* 1. Destination Field */}
            <div className="md:col-span-4 p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <label htmlFor="hero-destination-select" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-amber-500">location_on</span>
                <span>{t('hero.zoneLabel')}</span>
              </label>
              <select
                id="hero-destination-select"
                aria-label={t('hero.zoneLabel')}
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  scrollToResults();
                }}
                className="bg-transparent font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base focus:ring-0 focus:outline-none cursor-pointer w-full p-0 border-0"
              >
                <option value="all" className="dark:bg-slate-900">{t('hero.zoneAll')}</option>
                <option value="central" className="dark:bg-slate-900">{t('hero.zoneBkk')}</option>
                <option value="north" className="dark:bg-slate-900">{t('hero.zoneNorth')}</option>
                <option value="east" className="dark:bg-slate-900">{t('hero.zoneEast')}</option>
                <option value="south" className="dark:bg-slate-900">{t('hero.zoneSouth')}</option>
                <option value="isan" className="dark:bg-slate-900">{t('hero.zoneIsan')}</option>
              </select>
            </div>

            {/* 2. Keyword / Special Specs Field */}
            <div className="md:col-span-3 p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <label htmlFor="hero-search-keyword" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-sky-600">tune</span>
                <span>{t('hero.keywordLabel')}</span>
              </label>
              <input
                id="hero-search-keyword"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('hero.keywordPh')}
                className="bg-transparent font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base focus:ring-0 focus:outline-none w-full p-0 border-0 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* 3. Passengers & Vehicle Type Field */}
            <div className="md:col-span-3 p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <label htmlFor="hero-passengers-select" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">airline_seat_recline_extra</span>
                <span>{t('hero.seatsLabel')}</span>
              </label>
              <select
                id="hero-passengers-select"
                aria-label={t('hero.seatsLabel')}
                value={selectedSeats}
                onChange={(e) => {
                  setSelectedSeats(e.target.value);
                  scrollToResults();
                }}
                className="bg-transparent font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base focus:ring-0 focus:outline-none cursor-pointer w-full p-0 border-0"
              >
                <option value="all" className="dark:bg-slate-900">{t('hero.seatsAll')}</option>
                <option value="4-5" className="dark:bg-slate-900">{t('hero.seats45')}</option>
                <option value="7" className="dark:bg-slate-900">{t('hero.seats7')}</option>
                <option value="9" className="dark:bg-slate-900">{t('hero.seats9')}</option>
                <option value="10" className="dark:bg-slate-900">{t('hero.seats10')}</option>
                <option value="11-14" className="dark:bg-slate-900">{t('hero.seats11')}</option>
                <option value="16-24" className="dark:bg-slate-900">{t('hero.seats16')}</option>
              </select>
            </div>

            {/* 4. Primary CTA Search Button */}
            <div className="md:col-span-2 p-2.5 flex items-center bg-slate-50 dark:bg-slate-800/60">
              <button
                type="submit"
                onClick={scrollToResults}
                className="w-full h-full min-h-[50px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.99] border border-amber-600 rounded-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] font-bold">search</span>
                  <span>{t('hero.searchBtn', { count: resultCount })}</span>
                </div>
                <span className="text-[10px] text-slate-900 font-semibold tracking-wide">0% คอมมิชชั่น</span>
              </button>
            </div>
          </form>

          {/* Sharp Quick Filter Bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
              <span className="material-symbols-outlined text-[14px]">tune</span> {t('hero.quickTitle')}:
            </span>
            {activeTab === 'suv_driver' ? (
              <>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('suv7')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  {t('hero.quickSuv7')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('fortuner')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  {t('hero.quickFortuner')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('camry')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  {t('hero.quickCamry')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('tax')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🏢 {t('hero.quickTax')}
                </button>
              </>
            ) : activeTab === 'car' ? (
              <>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('ecocar')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  Eco Car
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('suv7')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  {t('hero.quickSuv7')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('tax')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🏢 {t('hero.quickTax')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('yellow')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🟡 {t('hero.quickYellow')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('massage')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  💆 {t('hero.quickMassage')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('majesty')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  👑 Toyota Majesty
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('tax')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🏢 {t('hero.quickTax')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
