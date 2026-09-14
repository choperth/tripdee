'use client';

import React from 'react';
import { ArrowDown, ShieldCheck, Phone, ReceiptText, MapPin } from 'lucide-react';
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

const inputCls =
  'w-full rounded-input border border-rule bg-paper-2 px-4 py-3 text-sm font-bold text-ink transition duration-220 ease-out placeholder:font-medium placeholder:text-ink-2/70 hover:border-ink-2/50 focus:border-accent';
const labelCls =
  'mb-1.5 block text-xs font-extrabold text-ink-2';

const TRUST = [
  { icon: ShieldCheck, key: 'hero.trust1', tint: 'bg-leaf-soft text-leaf' },
  { icon: Phone, key: 'hero.trust2', tint: 'bg-sky-soft text-sky' },
  { icon: ReceiptText, key: 'hero.trust3', tint: 'bg-sun-soft text-ink' },
] as const;

const CHIP_TINTS = [
  'bg-accent-soft text-ink',
  'bg-sky-soft text-sky',
  'bg-leaf-soft text-leaf',
  'bg-berry-soft text-berry',
  'bg-grape-soft text-grape',
  'bg-sun-soft text-ink',
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
    <section aria-label={t('hero.searchAria')} className="relative overflow-hidden">
      {/* playful backdrop */}
      <div aria-hidden="true" className="td-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] max-w-none -translate-x-1/2 rounded-full bg-accent-soft blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 md:pt-12 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="font-display text-[clamp(2rem,1rem+5vw,2.75rem)] font-extrabold leading-[1.15] tracking-tight text-ink md:text-display">
            {t('hero.titleA')}
            <span className="td-hl">{t('hero.titleB')}</span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15px] font-medium leading-relaxed text-ink-2">
            {t('hero.subtitle')}
          </p>
          <ul className="mt-5 flex flex-wrap items-center gap-2">
            {TRUST.map((item) => (
              <li
                key={item.key}
                className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-extrabold ${item.tint}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                {t(item.key)}
              </li>
            ))}
          </ul>
        </div>

        {/* search band */}
        <form
          role="search"
          aria-label={t('hero.filterAria')}
          onSubmit={(e) => {
            e.preventDefault();
            scrollToResults();
          }}
          className="td-elev-lift mt-8 rounded-modal bg-card p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="td-zone" className={labelCls}>
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-accent-deep" aria-hidden="true" />
                {t('hero.zoneLabel')}
              </label>
              <select
                id="td-zone"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className={inputCls}
              >
                <option value="all">{t('hero.zoneAll')}</option>
                <option value="ม่อนแจ่ม">{t('hero.zoneMonjam')}</option>
                <option value="ดอยอินทนนท์">{t('hero.zoneInthanon')}</option>
                <option value="แม่กำปอง">{t('hero.zoneMaekampong')}</option>
                <option value="ตัวเมือง">{t('hero.zoneCity')}</option>
                <option value="เชียงราย">{t('hero.zoneCross')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="td-seats" className={labelCls}>
                {t('hero.seatsLabel')}
              </label>
              <select
                id="td-seats"
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(e.target.value)}
                className={inputCls}
              >
                <option value="all">{t('hero.seatsAll')}</option>
                <option value="7">{t('hero.seats7')}</option>
                <option value="9">{t('hero.seats9')}</option>
                <option value="10">{t('hero.seats10')}</option>
                <option value="13">{t('hero.seats13')}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="td-q" className={labelCls}>
                {t('hero.keywordLabel')}
              </label>
              <input
                id="td-q"
                type="search"
                placeholder={t('hero.keywordPh')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-rule pt-4">
            <span className="text-[13px] font-extrabold text-ink-2">{t('hero.hot')}</span>
            {POPULAR_ROUTES.slice(0, 5).map((route, i) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedZone(route.filterKey)}
                className={`td-tab rounded-pill px-3 py-1.5 text-[13px] font-extrabold transition duration-220 ease-spring hover:-translate-y-0.5 ${CHIP_TINTS[i % CHIP_TINTS.length]}`}
              >
                {t(`route.${route.id}.name` as DictKey)}
              </button>
            ))}
          </div>

          <button
            type="submit"
            data-burst
            className="td-btn td-pop mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-3.5 text-base font-extrabold text-accent-ink"
          >
            {t('hero.searchBtn', { count: resultCount })}
            <ArrowDown className="h-5 w-5" aria-hidden="true" strokeWidth={3} />
          </button>
        </form>

        {/* photo band with a single sticker */}
        <div className="relative mt-8">
          <figure className="td-elev-card m-0 overflow-hidden rounded-card">
            <img
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80"
              alt={t('hero.photoAlt')}
              fetchPriority="high"
              className="aspect-[16/7] w-full object-cover"
            />
          </figure>
          <p className="td-sticker td-float absolute -top-4 left-4 flex items-center gap-1.5 rounded-pill bg-leaf px-4 py-2 text-[13px] font-extrabold text-white sm:left-8" style={{ animationDelay: '1.2s' }}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
            {t('hero.verifiedSticker')}
          </p>
          <p className="mt-3 text-[13px] font-bold text-ink-2">
            {t('hero.photoCaption')}
          </p>
        </div>
      </div>
    </section>
  );
};
