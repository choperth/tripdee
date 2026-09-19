'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  onOpenDriverSelfService?: () => void;
  onOpenRegisterModal?: () => void;
  onSelectZone?: (zone: string) => void;
  onSelectTab?: (tab: 'van' | 'car' | 'hotel' | 'corporate') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDriverSelfService,
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

  const handleSelectTab = (tab: 'van' | 'car' | 'hotel' | 'corporate') => {
    if (onSelectTab) onSelectTab(tab);
    scrollTo('results');
  };

  return (
    <footer className="w-full bg-navy-deep text-surface py-space-3xl mt-space-3xl border-t border-white/10">
      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* Main 5-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl pb-space-2xl">
          {/* Column 1 & 2: Brand Identity & Direct Connect */}
          <div className="lg:col-span-2 space-y-space-md">
            <div className="flex items-center gap-space-sm">
              <Image
                src="/logo-white.png"
                alt="TripDee ทริปดี"
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md tracking-tight text-surface">
                  TripDee ทริปดี
                </span>
                <span className="font-label-badge text-label-badge text-on-primary-container">
                  {t('foot.tagline')}
                </span>
              </div>
            </div>

            <p className="font-body-base text-body-base text-on-primary-container max-w-md leading-relaxed">
              {t('foot.desc')}
            </p>

            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <a
                href="https://line.me/R/ti/p/@731ruvzj"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-space-xs bg-line-green hover:bg-line-green-hover text-surface px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>LINE: @731ruvzj</span>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-space-xs bg-surface/10 hover:bg-surface/20 text-surface border border-surface/20 px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-colors"
              >
                <svg className="w-4 h-4 fill-current text-blue-action" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook: TripDee ทริปดี</span>
              </a>
            </div>
          </div>

          {/* Column 3: Vehicle Types */}
          <div>
            <h4 className="font-title-card text-title-card text-surface mb-space-md">
              {t('foot.vehTitle')}
            </h4>
            <ul className="space-y-space-xs font-body-base text-body-base text-on-primary-container">
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.veh1')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.veh2')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="text-left cursor-pointer hover:underline"
                >
                  Toyota Alphard / Vellfire
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => handleSelectTab('car')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.veh4')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => handleSelectTab('corporate')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.veh5')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Popular Routes */}
          <div>
            <h4 className="font-title-card text-title-card text-surface mb-space-md">
              {t('nav.routes')}
            </h4>
            <ul className="space-y-space-xs font-body-base text-body-base text-on-primary-container">
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('routes')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.route1')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('routes')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.route2')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('routes')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.route3')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('routes')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.route4')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('routes')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.route5')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Services & Partners */}
          <div>
            <h4 className="font-title-card text-title-card text-surface mb-space-md">
              {t('foot.svcTitle')}
            </h4>
            <ul className="space-y-space-xs font-body-base text-body-base text-on-primary-container">
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('corporate')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.svcCorp')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('corporate')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('foot.svcQuote')}
                </button>
              </li>
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRegisterModal) onOpenRegisterModal();
                  }}
                  className="text-left cursor-pointer hover:underline text-amber-accent"
                >
                  {t('nav.driverJoin')}
                </button>
              </li>
              {onOpenDriverSelfService && (
                <li className="hover:text-surface transition-colors">
                  <button
                    type="button"
                    onClick={onOpenDriverSelfService}
                    className="text-left cursor-pointer hover:underline"
                  >
                    {t('nav.driverManage')}
                  </button>
                </li>
              )}
              <li className="hover:text-surface transition-colors">
                <button
                  type="button"
                  onClick={() => scrollTo('tripboard')}
                  className="text-left cursor-pointer hover:underline"
                >
                  {t('nav.boardJobs')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-space-xl border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-subtext text-body-subtext text-on-primary-container">
          <div className="flex flex-wrap items-center gap-space-xs text-center sm:text-left">
            <span>{t('foot.copyright')}</span>
            <span>•</span>
            <span>{t('foot.regNote')}</span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="text-on-primary-container">{t('foot.terms')}</span>
            <span>•</span>
            <span className="text-on-primary-container">{t('foot.privacy')}</span>
            <span>•</span>
            <span className="text-on-primary-container">{t('foot.help')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
