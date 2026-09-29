'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface MemberPerksSectionProps {
  onSelectCorporate?: () => void;
  onOpenTripBoardPost?: () => void;
}

export const MemberPerksSection: React.FC<MemberPerksSectionProps> = ({
  onSelectCorporate,
  onOpenTripBoardPost,
}) => {
  const { t } = useLanguage();
  const [claimed, setClaimed] = useState<{ [key: string]: boolean }>({});

  // ซ่อน "สิทธิพิเศษสำหรับสมาชิกใหม่ & ผู้เดินทาง" ตามคำขอ
  if (true as boolean) return null;
  const handleClaim = (id: string, action?: () => void) => {
    setClaimed((prev) => ({ ...prev, [id]: true }));
    if (action) {
      action();
    }
  };

  return (
    <section aria-label={t('perk.aria')} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-none shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 dark:bg-white text-amber-400 dark:text-slate-900 flex items-center justify-center font-bold shrink-0 rounded-none">
              <span className="material-symbols-outlined text-[20px]">redeem</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {t('perk.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {t('perk.subtitle')}
              </p>
            </div>
          </div>
          <a
            className="text-xs font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 border-b border-slate-900 dark:border-white pb-0.5 self-start sm:self-auto cursor-pointer"
            href="#partners"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>{t('perk.allCoupons', { n: 4 })}</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </a>
        </div>

        {/* 4 Crisp Hairline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Voucher 1 */}
          <div className="border border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col justify-between hover:border-amber-500 transition-colors rounded-none">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200 dark:border-amber-900/50">
                <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 uppercase tracking-wider">
                  {t('perk.v1tag')}
                </span>
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  {t('perk.v1off')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('perk.v1title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {t('perk.v1desc')}
              </p>
            </div>
            <button
              onClick={() => {
                handleClaim('v1', () => {
                  document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
                });
              }}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs border border-amber-600 transition-all rounded-none cursor-pointer"
              type="button"
            >
              {claimed['v1'] ? t('perk.claimed1') : t('perk.claim')}
            </button>
          </div>

          {/* Voucher 2 */}
          <div className="border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex flex-col justify-between hover:border-emerald-500 transition-colors rounded-none">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 uppercase tracking-wider">
                  Welcome Drink
                </span>
                <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                  {t('perk.v2off')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('perk.v2title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {t('perk.v2desc')}
              </p>
            </div>
            <button
              onClick={() => handleClaim('v2')}
              className="mt-4 w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-800 transition-all rounded-none cursor-pointer"
              type="button"
            >
              {claimed['v2'] ? t('perk.claimed2') : t('perk.claim')}
            </button>
          </div>

          {/* Voucher 3 */}
          <div className="border border-sky-300 dark:border-sky-700/80 bg-sky-50/50 dark:bg-sky-950/20 p-4 flex flex-col justify-between hover:border-sky-500 transition-colors rounded-none">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-200 dark:border-sky-900/50">
                <span className="text-[10px] bg-sky-700 text-white font-bold px-1.5 py-0.5 uppercase tracking-wider">
                  {t('perk.v3tag')}
                </span>
                <span className="text-xs font-extrabold text-sky-900 dark:text-sky-300">
                  {t('perk.v3off')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('perk.v3title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {t('perk.v3desc')}
              </p>
            </div>
            <button
              onClick={() => {
                if (onSelectCorporate) {
                  onSelectCorporate();
                } else {
                  document.getElementById('corporate')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="mt-4 w-full py-2 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs border border-sky-800 transition-all rounded-none cursor-pointer"
              type="button"
            >
              {t('perk.v3cta')}
            </button>
          </div>

          {/* Voucher 4 */}
          <div className="border border-purple-300 dark:border-purple-700/80 bg-purple-50/50 dark:bg-purple-950/20 p-4 flex flex-col justify-between hover:border-purple-500 transition-colors rounded-none">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-200 dark:border-purple-900/50">
                <span className="text-[10px] bg-purple-700 text-white font-bold px-1.5 py-0.5 uppercase tracking-wider">
                  TripBoard Free
                </span>
                <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300">
                  {t('perk.v4off')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('perk.v4title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {t('perk.v4desc')}
              </p>
            </div>
            <button
              onClick={() => {
                if (onOpenTripBoardPost) {
                  onOpenTripBoardPost();
                } else {
                  const trigger = document.getElementById('open-post-modal-btn');
                  const el = document.getElementById('tripboard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  if (trigger) trigger.click();
                }
              }}
              className="mt-4 w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs border border-purple-800 transition-all rounded-none cursor-pointer"
              type="button"
            >
              {t('perk.v4cta')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
