'use client';

import React from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';

interface DriverEnrollmentBannerProps {
  onOpenRegister?: () => void;
}

export const DriverEnrollmentBanner: React.FC<DriverEnrollmentBannerProps> = ({ onOpenRegister }) => {
  const { t } = useLanguage();

  return (
    <section aria-label={t('enroll.aria')} className="max-w-7xl mx-auto px-4 sm:px-6 my-5 sm:my-7">
      <div className="bg-emerald-800 text-white border border-emerald-900 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white rounded-none">
            <span className="material-symbols-outlined text-[28px]">directions_car</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg md:text-xl font-bold tracking-tight">{t('enroll.title')}</h3>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 uppercase rounded-none">
                {t('enroll.freeBadge')}
              </span>
            </div>
            <p className="text-xs md:text-sm text-emerald-100 max-w-xl font-light leading-relaxed">
              {t('enroll.desc')}
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto flex items-center gap-2 flex-wrap">
          {onOpenRegister ? (
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-emerald-900 font-bold text-xs px-5 py-3 border border-white transition-colors rounded-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">person_add</span>
              <span>{t('enroll.webCta')}</span>
            </button>
          ) : null}
          <a
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-3 border border-emerald-700 transition-colors rounded-none cursor-pointer"
            href={OFFICIAL_LINE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[17px]">chat</span>
            <span>{t('enroll.lineCta')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
