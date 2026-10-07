'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ENABLE_QR_PAYMENT } from '@/lib/constants';

const MONTHS: Record<string, string[]> = {
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

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
  setSearchKeyword,
  activeTab = 'van',
  setActiveTab,
  setPlateFilter,
}) => {
  const { t, locale } = useLanguage();
  const months = MONTHS[locale] ?? MONTHS.th;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  // ---- Travel date range (always today or future, end >= start) ----
  const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseISODate = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
  };
  const todayISO = toISODate(new Date());
  const defaultStartISO = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toISODate(d);
  }, []);
  const [startDate, setStartDate] = useState(defaultStartISO);
  const [endDate, setEndDate] = useState(() => {
    const d = parseISODate(defaultStartISO);
    d.setDate(d.getDate() + 2);
    return toISODate(d);
  });

  // Clamp any range: no past dates, end never before start
  const clampRange = (startStr: string, endStr: string): [string, string] => {
    const s = startStr && startStr >= todayISO ? startStr : todayISO;
    const e = !endStr || endStr < s ? s : endStr;
    return [s, e];
  };

  const applyRange = (startStr: string, endStr: string) => {
    const [s, e] = clampRange(startStr, endStr);
    setStartDate(s);
    setEndDate(e);
  };

  const rangeInfo = React.useMemo(() => {
    const s = parseISODate(startDate >= todayISO ? startDate : todayISO);
    const e = parseISODate(endDate >= toISODate(s) ? endDate : toISODate(s));
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
    return {
      days,
      text: `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]}`,
      badge: days <= 1 ? t('hero.dateDayTrip') : t('hero.dateNights', { d: days, n: days - 1 }),
    };
  }, [startDate, endDate, todayISO, months, t]);

  useEffect(() => {
    if (!isDatePickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDatePickerOpen]);

  const setDatePreset = (days: number) => {
    const start = parseISODate(startDate >= todayISO ? startDate : todayISO);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);
    applyRange(toISODate(start), toISODate(end));
    setIsDatePickerOpen(false);
    scrollToResults();
  };

  const handleDateChange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) {
      if (startStr) setStartDate(startStr);
      if (endStr) setEndDate(endStr);
      return;
    }
    applyRange(startStr, endStr);
  };

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

  const applyQuickFilter = (type: 'yellow' | 'massage' | 'majesty' | 'tax' | 'suv7' | 'camry' | 'fortuner' | 'ecocar' | 'airport' | 'karaoke') => {
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
    } else if (type === 'airport') {
      setSearchKeyword('สนามบิน');
    } else if (type === 'karaoke') {
      setSearchKeyword('คาราโอเกะ');
    }
    scrollToResults();
  };

  return (
    <section
      aria-label={t('hero.searchAria')}
      className="relative w-full bg-[#0a192f] text-white pt-6 sm:pt-8 pb-6 sm:pb-8 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Tagline & Minimal Trust Badges */}
        <div className="max-w-3xl mb-4 sm:mb-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2.5">
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
              <span>{ENABLE_QR_PAYMENT ? t('hero.trust3') : t('hero.trust3_direct')}</span>
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
              <span>{t('hero.tabVan')}</span>
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
              <span>{t('hero.tabSuv')}</span>
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
              <span>{t('hero.tabCar')}</span>
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
              <span>{t('hero.tabCorp')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('tripboard')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
              <span>{t('hero.tabBoard')}</span>
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
              <label htmlFor="hero-destination-select" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-amber-500">location_on</span>
                <span>{t('hero.zoneLabel')}</span>
              </label>
              <div className="relative flex items-center">
                <select
                  id="hero-destination-select"
                  aria-label={t('hero.zoneLabel')}
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    scrollToResults();
                  }}
                  className="bg-transparent font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base focus:ring-0 focus:outline-none cursor-pointer w-full p-0 border-0 appearance-none pr-6"
                >
                  <option value="north" className="dark:bg-slate-900">{t('hero.zoneNorth')}</option>
                  <option value="central" className="dark:bg-slate-900">{t('hero.zoneCentral')}</option>
                  <option value="east" className="dark:bg-slate-900">{t('hero.zoneEastNew')}</option>
                  <option value="south" className="dark:bg-slate-900">{t('hero.zoneSouthNew')}</option>
                  <option value="isan" className="dark:bg-slate-900">{t('hero.zoneIsanNew')}</option>
                  <option value="huahin" className="dark:bg-slate-900">{t('hero.zoneHuahin')}</option>
                  <option value="all" className="dark:bg-slate-900">{t('hero.zoneAllNew')}</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-0 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* 2. Travel Dates Field */}
            <div className="md:col-span-3 p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px] text-sky-600">calendar_month</span>
                <span>{t('hero.dateLabel')}</span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base">
                  {rangeInfo.text}
                </span>
                <span className="text-[11px] border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 font-bold px-2 py-0.5 rounded-none whitespace-nowrap">
                  {rangeInfo.badge}
                </span>
              </div>

              {/* Date Popover */}
              {isDatePickerOpen && (
                <div
                  ref={datePickerRef}
                  className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 shadow-xl rounded-none text-xs text-slate-900 dark:text-white"
                >
                  <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
                    <span>{t('hero.datePickTitle')}</span>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">{t('hero.dateStart')}</label>
                      <input
                        type="date"
                        value={startDate}
                        min={todayISO}
                        onChange={(e) => handleDateChange(e.target.value, endDate)}
                        className="w-full border border-slate-300 dark:border-slate-700 p-1.5 bg-transparent font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">{t('hero.dateEnd')}</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate >= todayISO ? startDate : todayISO}
                        onChange={(e) => handleDateChange(startDate, e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 p-1.5 bg-transparent font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[1, 2, 3, 4].map((d) => {
                      const label = d === 1 ? t('hero.dateDayTrip') : t('hero.dateNights', { d, n: d - 1 });
                      const active = rangeInfo.days === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDatePreset(d)}
                          className={`px-2 py-1 text-[10px] ${
                            active
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen(false);
                      scrollToResults();
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-white py-1.5 font-bold text-xs cursor-pointer"
                  >
                    {t('hero.dateConfirm')}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Passengers & Vehicle Type Field */}
            <div className="md:col-span-3 p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <label htmlFor="hero-passengers-select" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">airline_seat_recline_extra</span>
                <span>{t('hero.seatsLabel')}</span>
              </label>
              <div className="relative flex items-center">
                <select
                  id="hero-passengers-select"
                  aria-label={t('hero.seatsLabel')}
                  value={selectedSeats}
                  onChange={(e) => {
                    setSelectedSeats(e.target.value);
                    scrollToResults();
                  }}
                  className="bg-transparent font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base focus:ring-0 focus:outline-none cursor-pointer w-full p-0 border-0 appearance-none pr-6"
                >
                  <option value="9" className="dark:bg-slate-900">{t('hero.seats9')}</option>
                  <option value="10" className="dark:bg-slate-900">{t('hero.seats10filter')}</option>
                  <option value="7" className="dark:bg-slate-900">{t('hero.seatsExec')}</option>
                  <option value="4-7" className="dark:bg-slate-900">{t('hero.seatsEco')}</option>
                  <option value="16-24" className="dark:bg-slate-900">{t('hero.seatsMinibus')}</option>
                  <option value="all" className="dark:bg-slate-900">{t('hero.seatsAllSizes')}</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-0 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* 4. Primary CTA Search Button */}
            <div className="md:col-span-2 p-2.5 flex items-center bg-slate-50 dark:bg-slate-800/60">
              <button
                type="submit"
                onClick={scrollToResults}
                className="w-full h-full min-h-[52px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.99] border border-amber-600 rounded-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] font-bold">search</span>
                  <span>{t('hero.searchBtn')}</span>
                </div>
                <span className="text-[10px] text-slate-900 font-semibold tracking-wide">{t('hero.zeroFeeBadge')}</span>
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
                  onClick={() => applyQuickFilter('tax')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🏢 {t('hero.quickTax')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('airport')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  ✈️ {t('hero.quickAirport')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('karaoke')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🎵 {t('hero.quickKaraoke')}
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
                  👑 {t('hero.quickMassage')}
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
                <button
                  type="button"
                  onClick={() => applyQuickFilter('airport')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  ✈️ {t('hero.quickAirport')}
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickFilter('karaoke')}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 font-medium transition-colors rounded-none cursor-pointer text-xs"
                >
                  🎵 {t('hero.quickKaraoke')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
