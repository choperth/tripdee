'use client';

import React from 'react';
import { ArrowDown, ShieldCheck, Phone, ReceiptText, MapPin, Users, Search, Sparkles } from 'lucide-react';
import { POPULAR_ROUTES } from '@/data/mockData';
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
  { icon: ShieldCheck, key: 'hero.trust1', label: 'ป้ายเหลือง & ตรวจประวัติคนขับ', tint: 'bg-leaf-soft text-leaf' },
  { icon: Phone, key: 'hero.trust2', label: 'ติดต่อคนขับตรง 0% หักหัวคิว', tint: 'bg-sky-soft text-sky' },
  { icon: ReceiptText, key: 'hero.trust3', label: 'ใบเสนอราคา & หัก ณ ที่จ่าย 3%', tint: 'bg-sun-soft text-sun-ink' },
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
    <section aria-label={t('hero.searchAria')} className="relative overflow-hidden pt-4 sm:pt-6">
      {/* Subtle Lanna Nature Backdrop Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[56rem] max-w-none -translate-x-1/2 rounded-full bg-accent/8 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pt-10 lg:px-8 text-center">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 rounded-pill bg-card px-4 py-1.5 text-xs font-extrabold text-ink shadow-sm border border-rule/80 mb-5">
          <span className="grid h-2 w-2 rounded-full bg-sun animate-pulse" />
          <span>ทริปดีๆ เริ่มต้นที่นี่ • ศูนย์รวมรถตู้ VIP & ที่พัก เชียงใหม่</span>
        </div>

        {/* Main Headline */}
        <h1 className="mx-auto max-w-3xl font-display text-[clamp(2.1rem,1.2rem+4.5vw,3.25rem)] font-extrabold leading-[1.18] tracking-tight text-ink">
          {t('hero.titleA')}{' '}
          <span className="text-accent underline decoration-accent/30 decoration-wavy underline-offset-8">
            {t('hero.titleB')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-[62ch] text-[15px] sm:text-base font-medium leading-relaxed text-ink-2">
          {t('hero.subtitle')}
        </p>

        {/* Trust Badges Bar */}
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST.map((item) => (
            <li
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold ${item.tint} border border-rule/40 shadow-xs`}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2.5} />
              <span>{t(item.key)}</span>
            </li>
          ))}
        </ul>

        {/* ========================================================= */}
        {/* Floating Unified Search Box (แคปซูลค้นหาลอยตัวตรงกลาง) */}
        {/* ========================================================= */}
        <form
          role="search"
          aria-label={t('hero.filterAria')}
          onSubmit={(e) => {
            e.preventDefault();
            scrollToResults();
          }}
          className="td-elev-lift mx-auto mt-9 w-full max-w-4xl rounded-3xl md:rounded-full bg-card p-2 md:p-2.5 border border-rule shadow-lift transition-all hover:shadow-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
            {/* Segment 1: Zone / Destination */}
            <div className="flex-1 text-left px-3.5 py-2 hover:bg-paper/80 rounded-2xl md:rounded-l-full transition-colors">
              <label
                htmlFor="td-zone"
                className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-accent"
              >
                <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {t('hero.zoneLabel')}
              </label>
              <select
                id="td-zone"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-transparent font-display text-sm font-extrabold text-ink focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="all">{t('hero.zoneAll')}</option>
                <option value="ม่อนแจ่ม">{t('hero.zoneMonjam')}</option>
                <option value="ดอยอินทนนท์">{t('hero.zoneInthanon')}</option>
                <option value="แม่กำปอง">{t('hero.zoneMaekampong')}</option>
                <option value="ตัวเมือง">{t('hero.zoneCity')}</option>
                <option value="เชียงราย">{t('hero.zoneCross')}</option>
              </select>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-9 w-px bg-rule shrink-0" />

            {/* Segment 2: Capacity / Seats */}
            <div className="flex-1 text-left px-3.5 py-2 hover:bg-paper/80 rounded-2xl transition-colors">
              <label
                htmlFor="td-seats"
                className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-accent"
              >
                <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {t('hero.seatsLabel')}
              </label>
              <select
                id="td-seats"
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(e.target.value)}
                className="w-full bg-transparent font-display text-sm font-extrabold text-ink focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="all">{t('hero.seatsAll')}</option>
                <option value="7">{t('hero.seats7')}</option>
                <option value="9">{t('hero.seats9')}</option>
                <option value="10">{t('hero.seats10')}</option>
                <option value="13">{t('hero.seats13')}</option>
              </select>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-9 w-px bg-rule shrink-0" />

            {/* Segment 3: Keyword / Amenities */}
            <div className="flex-1 text-left px-3.5 py-2 hover:bg-paper/80 rounded-2xl transition-colors">
              <label
                htmlFor="td-q"
                className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-accent"
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
                className="w-full bg-transparent font-display text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-2/60 focus:outline-none mt-0.5"
              />
            </div>

            {/* Segment 4: Search Button */}
            <div className="p-1 shrink-0">
              <button
                type="submit"
                className="td-btn td-pop inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-full bg-accent hover:bg-accent-deep px-6 py-3.5 text-sm font-extrabold text-accent-ink shadow-md hover:shadow-lg transition-all"
              >
                <span>{t('hero.searchBtn', { count: resultCount })}</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
              </button>
            </div>
          </div>
        </form>

        {/* Quick Route Filter Pills below Capsule */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-extrabold text-ink-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-sun" />
            {t('hero.hot')}
          </span>
          {POPULAR_ROUTES.slice(0, 5).map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => setSelectedZone(route.filterKey)}
              className={`td-btn rounded-pill px-3 py-1 text-xs font-extrabold transition-all border ${
                selectedZone === route.filterKey
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'bg-card text-ink-2 border-rule hover:border-accent/40 hover:text-ink'
              }`}
            >
              {t(`route.${route.id}.name` as DictKey)}
            </button>
          ))}
        </div>

        {/* Premium Vehicle Visual Banner */}
        <div className="relative mt-8">
          <figure className="td-elev-card m-0 overflow-hidden rounded-card border border-rule">
            <img
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85"
              alt={t('hero.photoAlt')}
              fetchPriority="high"
              className="aspect-[16/7] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </figure>
          <p
            className="td-sticker td-float absolute -top-4 left-4 flex items-center gap-1.5 rounded-pill bg-leaf px-4 py-2 text-xs font-extrabold text-white shadow-md sm:left-8"
            style={{ animationDelay: '1.2s' }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
            {t('hero.verifiedSticker')}
          </p>
          <p className="mt-3 text-xs font-bold text-ink-2">
            {t('hero.photoCaption')}
          </p>
        </div>
      </div>
    </section>
  );
};
