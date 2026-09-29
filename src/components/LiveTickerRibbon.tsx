'use client';

import React from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';

interface LiveTickerRibbonProps {
  totalVans?: number;
}

export const LiveTickerRibbon: React.FC<LiveTickerRibbonProps> = ({ totalVans = 24 }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-[#0a192f] text-white/90 text-xs py-2 border-b border-slate-800 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-none animate-pulse"></span>
            <span className="text-white font-bold tracking-wide uppercase text-[11px]">{t('ticker.label')}</span>
            <span className="text-slate-200 text-xs">{t('ticker.matched')}</span>
          </div>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-amber-400 font-medium hidden md:inline-flex items-center gap-1.5 text-xs">
            <span className="material-symbols-outlined text-[14px]">airport_shuttle</span>
            <span>{t('ticker.vansReady', { n: totalVans })}</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
            <span>{t('ticker.zeroFee')}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-amber-400">security</span>
            <span>{t('ticker.yellowOk')}</span>
          </span>
          <a
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 border-b border-emerald-400/40"
            href={OFFICIAL_LINE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[14px]">chat</span>
            <span>LINE: @tripdee</span>
          </a>
        </div>
      </div>
    </div>
  );
};
