'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu,
  X,
  CarFront,
  Briefcase,
  User,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPortal: () => void;
  onOpenDriverSelfService?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenPortal,
  onOpenDriverSelfService,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // โหมดสว่างเป็นค่าพื้นฐาน: บังคับ light เสมอ (ปุ่มสลับธีมซ่อนไว้ โค้ด dark mode ยังอยู่ครบ)
  useEffect(() => {
    try {
      localStorage.removeItem('td-theme');
    } catch {}
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setScrolled(window.scrollY > 10);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollTo = (id: string, requiredTab?: string) => {
    setMenuOpen(false);
    const isMainPageSection = ['results', 'tripboard', 'routes'].includes(id);
    const targetTab =
      requiredTab ||
      (isMainPageSection
        ? ['van', 'suv_driver', 'car'].includes(activeTab)
          ? activeTab
          : 'van'
        : id === 'corporate'
        ? 'corporate'
        : undefined);

    if (targetTab && activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    if (id === 'corporate' && targetTab === 'corporate') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 15) {
        attempts++;
        setTimeout(tryScroll, 40);
      }
    };
    requestAnimationFrame(tryScroll);
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab === 'corporate') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById('results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 15) {
        attempts++;
        setTimeout(tryScroll, 40);
      }
    };
    requestAnimationFrame(tryScroll);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 w-full z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-shadow ${scrolled ? 'shadow-xs' : ''}`}>
      <nav aria-label={t('nav.main')} className="w-full">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-6">
          {/* LEFT: Official Logo & Live Signal */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className="flex shrink-0 items-center py-1 transition-transform hover:scale-[1.01] focus:outline-none cursor-pointer"
              aria-label={t('nav.home')}
            >
              <Image
                src="/logo.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-8 w-auto object-contain block dark:hidden"
                priority
              />
              <Image
                src="/logo-white.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-8 w-auto object-contain hidden dark:block"
                priority
              />
            </button>
            <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
              <span className="inline-block w-1.5 h-1.5 bg-[#06C755] rounded-full"></span>
            </div>
          </div>

          {/* CENTER: Main Navigation Links (Clean sharp borders - Bauhaus Swiss style) */}
          <div className="hidden lg:flex items-center h-16 gap-1">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className={`h-full px-3 text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'van'
                  ? 'font-bold text-slate-950 dark:text-white border-slate-950 dark:border-white bg-slate-50/60 dark:bg-slate-900/60'
                  : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">airport_shuttle</span>
              <span>{t('nav.van')}</span>
            </button>
            <button
              type="button"
              onClick={() => selectTab('suv_driver')}
              className={`h-full px-3 text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'suv_driver'
                  ? 'font-bold text-slate-950 dark:text-white border-slate-950 dark:border-white bg-slate-50/60 dark:bg-slate-900/60'
                  : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">directions_car</span>
              <span>{t('nav.suvDriverShort')}</span>
            </button>
            <button
              type="button"
              onClick={() => selectTab('car')}
              className={`h-full px-3 text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'car'
                  ? 'font-bold text-slate-950 dark:text-white border-slate-950 dark:border-white bg-slate-50/60 dark:bg-slate-900/60'
                  : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">key</span>
              <span>{t('nav.car')}</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo('tripboard', 'van')}
              className="h-full px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white flex items-center gap-1.5 border-b-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">sync_alt</span>
              <span>{t('nav.tripboardShort')}</span>
              <span className="text-[9px] bg-red-600 text-white font-black px-1 py-0.2 tracking-wider">HOT</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo('corporate', 'corporate')}
              className={`h-full px-3 text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'corporate'
                  ? 'font-bold text-slate-950 dark:text-white border-slate-950 dark:border-white bg-slate-50/60 dark:bg-slate-900/60'
                  : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">domain</span>
            </button>
          </div>

          {/* RIGHT: Actions, Language Switcher, Driver Portal, Customer Post CTA */}
          <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-2 min-w-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Driver Portal CTA */}
            {onOpenDriverSelfService && (
              <button
                type="button"
                onClick={onOpenDriverSelfService}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all rounded-none cursor-pointer"
                title={t('nav.driverCta')}
              >
                <span className="material-symbols-outlined text-[16px] text-[#06C755]">
                  local_taxi
                </span>
                <span>{t('nav.driverCtaShort')}</span>
                <span className="text-[9px] bg-[#E8F9EE] dark:bg-emerald-950 text-[#06C755] border border-emerald-200 dark:border-emerald-800 px-1 font-bold">
                  {t('nav.free')}
                </span>
              </button>
            )}

            {/* User Login/Portal */}
            {user ? (
              <button
                type="button"
                onClick={onOpenPortal}
                aria-label={
                  user.role === 'driver'
                    ? (user.driverNickname || user.name)
                    : user.role === 'customer'
                    ? (user.companyName || user.name)
                    : t('nav.admin')
                }
                title={
                  user.role === 'driver'
                    ? (user.driverNickname || user.name)
                    : user.role === 'customer'
                    ? (user.companyName || user.name)
                    : t('nav.admin')
                }
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 transition-all rounded-none shrink-0 cursor-pointer"
              >
                {user.role === 'driver' && <CarFront className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                {user.role === 'customer' && (
                  user.customerType === 'individual'
                    ? <User className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    : <Briefcase className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                )}
                {user.role === 'admin' && <Crown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                <span className="hidden sm:inline max-w-[85px] truncate">
                  {user.role === 'driver' && (user.driverNickname || user.name)}
                  {user.role === 'customer' && (user.customerType === 'individual' ? user.name : (user.companyName || user.name))}
                  {user.role === 'admin' && t('nav.admin')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 transition-all rounded-none shrink-0 cursor-pointer"
                aria-label={t('nav.login')}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </button>
            )}
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {menuOpen && (
          <div className="lg:hidden bg-paper-elevated dark:bg-slate-900 border-b border-border-subtle dark:border-slate-800 px-margin py-space-md space-y-space-sm shadow-xl max-h-[calc(100dvh-5rem)] overflow-y-auto">
            {/* Quick Actions in Mobile Drawer: Language Row + Theme Toggle */}
            <div className="pb-space-xs border-b border-border-subtle dark:border-slate-800">
              <LanguageSwitcher variant="row" onPick={() => setMenuOpen(false)} />
            </div>

            <div className="grid grid-cols-2 gap-space-xs pb-space-xs">
              <button
                type="button"
                onClick={() => selectTab('van')}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 transition-colors ${
                  activeTab === 'van'
                    ? 'bg-blue-subtle dark:bg-blue-950/80 text-blue-action dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🚐</span>
                <span className="truncate">{t('nav.van')}</span>
              </button>
              <button
                type="button"
                onClick={() => selectTab('suv_driver')}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 transition-colors ${
                  activeTab === 'suv_driver'
                    ? 'bg-blue-subtle dark:bg-blue-950/80 text-blue-action dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🚗</span>
                <span className="truncate">{t('nav.suvDriver')}</span>
              </button>
              <button
                type="button"
                onClick={() => selectTab('car')}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 transition-colors ${
                  activeTab === 'car'
                    ? 'bg-blue-subtle dark:bg-blue-950/80 text-blue-action dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🔑</span>
                <span className="truncate">{t('nav.car')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  selectTab('corporate');
                  scrollTo('corporate');
                }}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 transition-colors ${
                  activeTab === 'corporate'
                    ? 'bg-blue-subtle dark:bg-blue-950/80 text-blue-action dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🏢</span>
                <span className="truncate">{t('nav.b2b')}</span>
              </button>
            </div>

            <div className="flex flex-col gap-1 border-t border-border-subtle dark:border-slate-800 pt-space-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollTo('tripboard', 'van');
                }}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                📋 {t('nav.boardJobs')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollTo('routes', 'van');
                }}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                🗺️ {t('nav.routesPopular')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollTo('corporate', 'corporate');
                }}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                🏢 {t('nav.corpService')}
              </button>
            </div>

            <div className="border-t border-border-subtle dark:border-slate-800 pt-space-sm flex flex-col gap-space-xs">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPortal();
                  }}
                  className="w-full h-11 bg-navy-deep hover:bg-navy-surface dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {user.role === 'driver' && <CarFront className="w-4 h-4" />}
                  {user.role === 'customer' && <Briefcase className="w-4 h-4" />}
                  {user.role === 'admin' && <Crown className="w-4 h-4" />}
                  <span>{t('nav.dashboard', { name: user.driverNickname || user.companyName || user.name })}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenLoginModal();
                  }}
                  className="w-full h-11 bg-navy-deep hover:bg-navy-surface dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{t('nav.loginMobile')}</span>
                </button>
              )}
              {onOpenDriverSelfService && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDriverSelfService();
                  }}
                  className="w-full h-11 border border-border-subtle dark:border-slate-700 bg-paper-surface-muted dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-navy-deep dark:text-slate-100 rounded-xl font-body-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-accent">
                    airport_shuttle
                  </span>
                  <span>{t('nav.driverManage')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenRegisterModal();
                }}
                className="w-full h-10 border border-border-subtle dark:border-slate-700 rounded-xl text-ink-primary dark:text-slate-200 font-body-medium text-center hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                {t('nav.driverJoin')}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
