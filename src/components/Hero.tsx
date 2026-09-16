'use client';

import React from 'react';
import { ArrowDown, ShieldCheck, Phone, ReceiptText, MapPin, Users, Search, CheckCircle2 } from 'lucide-react';
import { SEAT_CAPACITY_OPTIONS } from '@/data/vehicleModels';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';

interface HeroProps {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  selectedSeats: string;
  setSelectedSeats: (seats: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  resultCount: number;
}

const TRUST = [
  { icon: ShieldCheck, key: 'hero.trust1', label: 'ป้ายเหลือง & ตรวจประวัติคนขับ 100%' },
  { icon: Phone, key: 'hero.trust2', label: 'ติดต่อคนขับตรง 0% ค่าธรรมเนียมนายหน้า' },
  { icon: ReceiptText, key: 'hero.trust3', label: 'ใบเสนอราคา & หัก ณ ที่จ่าย 3% ถูกต้อง' },
] as const;

export const Hero: React.FC<HeroProps> = ({
  selectedZone,
  setSelectedZone,
  selectedSeats,
  setSelectedSeats,
  searchKeyword,
  setSearchKeyword,
  resultCount,
}) => {
  const { t } = useLanguage();

  const scrollToResults = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('results')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section aria-label={t('hero.searchAria')} className="relative overflow-hidden bg-paper pt-4 pb-8 sm:pt-8 sm:pb-12 border-b border-rule">
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink leading-tight">
            {t('hero.titleA')}{' '}
            <span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-4">
              {t('hero.titleB')}
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-ink-2">
            {t('hero.subtitle')}
          </p>

          {/* Quick Trust Highlights */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-ink-2">
            {TRUST.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-leaf" strokeWidth={2.5} />
                <span>{t(item.key)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Clean Utility Search Console Card (Airbnb / Booking style) */}
        {/* ========================================================= */}
        <div className="mt-8 mx-auto max-w-4xl">
          <form
            role="search"
            aria-label={t('hero.filterAria')}
            onSubmit={(e) => {
              e.preventDefault();
              scrollToResults();
            }}
            className="rounded-card bg-card p-3 sm:p-4 border border-rule shadow-card transition-shadow hover:shadow-lift"
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-3 items-center">
              {/* Segment 1: Zone Selector */}
              <div className="flex flex-col justify-center px-3 py-2 rounded-input bg-paper border border-rule/70 hover:border-accent/40 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <label
                  htmlFor="td-zone"
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t('hero.zoneLabel')}
                </label>
                <select
                  id="td-zone"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="all">{t('hero.zoneAll')}</option>
                  <option value="bkk">{t('hero.zoneBkk')}</option>
                  <option value="north">{t('hero.zoneNorth')}</option>
                  <option value="east">{t('hero.zoneEast')}</option>
                  <option value="south">{t('hero.zoneSouth')}</option>
                  <option value="isan">{t('hero.zoneIsan')}</option>
                </select>
              </div>

              {/* Segment 2: Seats Selector */}
              <div className="flex flex-col justify-center px-3 py-2 rounded-input bg-paper border border-rule/70 hover:border-accent/40 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <label
                  htmlFor="td-seats"
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-2"
                >
                  <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t('hero.seatsLabel')}
                </label>
                <select
                  id="td-seats"
                  value={selectedSeats}
                  onChange={(e) => setSelectedSeats(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer mt-0.5"
                >
                  {SEAT_CAPACITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Segment 3: Keyword / Amenities */}
              <div className="flex flex-col justify-center px-3 py-2 rounded-input bg-paper border border-rule/70 hover:border-accent/40 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <label
                  htmlFor="td-q"
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-2"
                >
                  <Search className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t('hero.keywordLabel')}
                </label>
                <input
                  id="td-q"
                  type="search"
                  placeholder={t('hero.keywordPh')}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-ink placeholder:font-normal placeholder:text-ink-2/60 focus:outline-none mt-0.5"
                />
              </div>

              {/* Segment 4: Search CTA Button */}
              <div>
                <button
                  type="submit"
                  className="td-btn td-pop inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-input bg-accent hover:bg-accent-deep px-6 py-3.5 text-sm font-extrabold text-white shadow-xs transition-all"
                >
                  <span>{t('hero.searchBtn', { count: resultCount })}</span>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Photo & Fleet Overview Strip */}
        <div className="relative mt-8 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-card border border-rule bg-card">
            <img
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85"
              alt={t('hero.photoAlt')}
              fetchPriority="high"
              className="aspect-[21/9] sm:aspect-[24/9] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-2 text-white">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-leaf px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                  {t('hero.verifiedSticker')}
                </span>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white/90 drop-shadow-sm">
                  {t('hero.photoCaption')}
                </p>
              </div>
              <p className="text-xs text-white/80 font-medium hidden sm:block">
                รถตู้ VIP 9-10 ที่นั่ง • มินิบัส 20 ที่นั่ง • รถตู้หรู Alphard/Staria • SUV ลุยดอย • ซีดานผู้บริหาร
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
