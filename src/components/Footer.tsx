'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { OFFICIAL_LINE_URL, OFFICIAL_FACEBOOK_URL } from '@/lib/constants';

interface FooterProps {
  onOpenRegisterModal?: () => void;
  onSelectZone?: (zone: string) => void;
  onSelectTab?: (tab: 'van' | 'suv_driver' | 'car' | 'hotel' | 'corporate') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenRegisterModal,
  onSelectZone,
  onSelectTab,
}) => {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTab = (tab: 'van' | 'suv_driver' | 'car' | 'hotel' | 'corporate') => {
    if (onSelectTab) onSelectTab(tab);
    scrollTo('results');
  };

  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-8 sm:py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          {/* Col 1: Brand Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <Image
                src="/logo-white.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              {t('foot.brandDesc')}
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 font-bold border border-emerald-300 dark:border-emerald-700 rounded-none">
                <span className="material-symbols-outlined text-[12px]">verified</span> {t('foot.badgeDirect')}
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 font-bold border border-amber-300 dark:border-amber-700 rounded-none">
                <span className="material-symbols-outlined text-[12px]">security</span> {t('foot.badgePa')}
              </span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              {t('foot.services')}
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.sVanVip')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.sMajesty')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('car')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.sSelfDrive')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('tripboard')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.sBoard')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('corporate')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.sB2b')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Service Zones */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              {t('foot.routes')}
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('isan');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.rKhaoyai')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('east');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.rPattaya')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('north');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.rMonjam')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('huahin');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.rHuahin')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('central');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.rAirport')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              {t('foot.contact')}
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenRegisterModal}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  {t('foot.driverJoin')}
                </button>
              </li>
              <li className="text-slate-600 dark:text-slate-400">
                {t('foot.support247')}
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  href={OFFICIAL_LINE_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  <span>LINE Official: @tripdee</span>
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-slate-950 dark:hover:text-white transition-colors"
                  href={OFFICIAL_FACEBOOK_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-blue-600 shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook: TripDee ทริปดี</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom DBD note */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <p>{t('foot.copyNote')}</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">{t('foot.privacyLink')}</span>
            <span>/</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">{t('foot.termsLink')}</span>
            <span>/</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">{t('foot.safety')}</span>
            <span>/</span>
            <a href="/admin" className="hover:text-slate-900 dark:hover:text-white transition-colors">แอดมิน (Console)</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
