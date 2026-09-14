'use client';

import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="td-marquee border-b border-paper/15 py-4" aria-hidden="true">
        <div className="td-marquee-track font-display text-[clamp(1rem,2.5vw,1.5rem)] font-extrabold">
          <span className="pr-10">{t('footer.marquee').repeat(3)}</span>
          <span className="pr-10">{t('footer.marquee').repeat(3)}</span>
        </div>
      </div>
      <p className="sr-only">{t('footer.srOnly')}</p>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 font-display text-2xl font-extrabold tracking-tight">
              TripDee
              <span aria-hidden="true" className="td-dot inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            </p>
            <p className="mt-2 text-sm font-bold text-paper/70">{t('footer.tagline')}</p>
          </div>
          <ul className="flex flex-wrap items-center gap-2 text-[13px] font-extrabold">
            <li className="inline-flex items-center gap-1.5 rounded-pill bg-paper/10 px-3.5 py-2">
              <MapPin className="h-4 w-4 text-sun" aria-hidden="true" />
              {t('footer.chiangmai')}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-pill bg-paper/10 px-3.5 py-2">
              <MessageCircle className="h-4 w-4 text-leaf" aria-hidden="true" />
              LINE @tripdee
            </li>
            <li className="td-fig inline-flex items-center rounded-pill bg-paper/10 px-3.5 py-2">
              © {new Date().getFullYear()}
            </li>
          </ul>
        </div>
        <p className="border-t-2 border-dashed border-paper/15 pt-5 text-xs font-medium leading-relaxed text-paper/50">
          {t('footer.note')}
        </p>
      </div>
    </footer>
  );
};
