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
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenRegisterModal?: () => void;
  onOpenLoginModal?: () => void;
  /**
   * Opens the driver centre. The entry is rendered only when this is provided,
   * so pages that have no driver destination do not show a dead button.
   */
  onOpenDriverEntry?: () => void;
  onOpenPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'van',
  setActiveTab = () => {},
  onOpenRegisterModal = () => {},
  onOpenLoginModal = () => {},
  onOpenDriverEntry,
  onOpenPortal = () => {},
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

  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [menuOpen]);

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
    <header className={`fixed top-0 left-0 right-0 w-full z-[160] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-shadow ${scrolled ? 'shadow-xs' : ''}`}>
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
          <div className="flex items-center justify-end shrink-0 gap-1.5 sm:gap-2 min-w-0">
            {/* Language Switcher: desktop & tablet pill dropdown; mobile uses the row switcher in the drawer */}
            <div className="hidden sm:block shrink-0">
              <LanguageSwitcher />
            </div>

            {/* Driver centre — a separate, clearly labelled entry so the passenger login stays unambiguous */}
            {onOpenDriverEntry && (
              <button
                type="button"
                onClick={onOpenDriverEntry}
                aria-label={t('nav.driverCenter')}
                title={t('nav.driverCenter')}
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-white transition-all rounded-none shrink-0 cursor-pointer"
              >
                <CarFront className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="text-[11px] sm:text-xs">{t('nav.driverCenter')}</span>
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
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 transition-all rounded-none shrink-0 cursor-pointer"
              >
                {user.role === 'driver' && <CarFront className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                {user.role === 'customer' && (
                  user.customerType === 'individual'
                    ? <User className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    : <Briefcase className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                )}
                {user.role === 'admin' && <Crown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                <span className="max-w-[80px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                  {user.role === 'driver' && (user.driverNickname ? user.driverNickname.split(' ')[0] : user.name)}
                  {user.role === 'customer' && (user.customerType === 'individual' ? user.name.split(' ')[0] : (user.companyName || user.name))}
                  {user.role === 'admin' && t('nav.admin')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 transition-all rounded-none shrink-0 cursor-pointer"
                aria-label={t('nav.login')}
              >
                <User className="w-4 h-4" />
                <span className="text-[11px] sm:text-xs">{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {/* MOBILE SLIDE-DOWN DRAWER & BACKDROP */}
        {menuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Mobile Drawer Panel */}
            <div
              className="fixed inset-x-0 top-16 z-50 lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-2xl max-h-[calc(100dvh-4rem)] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.main')}
            >
              <div className="p-4 space-y-4 max-w-lg mx-auto">
                {/* 1. Language Row Switcher */}
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 mb-2 text-slate-500 dark:text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('lang.switch')}</span>
                  </div>
                  <LanguageSwitcher variant="row" onPick={() => setMenuOpen(false)} />
                </div>

                {/* 2. Vehicle / Service Categories (2x2 Grid) */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => selectTab('van')}
                      className={`p-3 text-left flex items-center gap-2.5 rounded-none border transition-all cursor-pointer ${
                        activeTab === 'van'
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-2xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0">airport_shuttle</span>
                      <span className="text-xs leading-tight">{t('nav.van')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab('suv_driver')}
                      className={`p-3 text-left flex items-center gap-2.5 rounded-none border transition-all cursor-pointer ${
                        activeTab === 'suv_driver'
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-2xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0">directions_car</span>
                      <span className="text-xs leading-tight">{t('nav.suvDriverShort')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab('car')}
                      className={`p-3 text-left flex items-center gap-2.5 rounded-none border transition-all cursor-pointer ${
                        activeTab === 'car'
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-2xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0">key</span>
                      <span className="text-xs leading-tight">{t('nav.car')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        selectTab('corporate');
                        scrollTo('corporate');
                      }}
                      className={`p-3 text-left flex items-center gap-2.5 rounded-none border transition-all cursor-pointer ${
                        activeTab === 'corporate'
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-2xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0">corporate_fare</span>
                      <span className="text-xs leading-tight">{t('nav.b2bShort')}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Navigation Links */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      scrollTo('tripboard', 'van');
                    }}
                    className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-none text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[19px] text-slate-700 dark:text-slate-300">forum</span>
                      <span>{t('nav.boardJobs')}</span>
                      <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 tracking-wider">HOT</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      scrollTo('routes', 'van');
                    }}
                    className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-none text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[19px] text-slate-700 dark:text-slate-300">map</span>
                      <span>{t('nav.routesPopular')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      scrollTo('corporate', 'corporate');
                    }}
                    className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-none text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[19px] text-slate-700 dark:text-slate-300">corporate_fare</span>
                      <span>{t('nav.corpService')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* 4. Action / Driver Buttons */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenPortal();
                      }}
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-none font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
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
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-none font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>{t('nav.loginMobile')}</span>
                    </button>
                  )}


                  {onOpenDriverEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenDriverEntry();
                      }}
                      className="w-full h-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-none text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CarFront className="w-4 h-4" />
                      <span>{t('nav.driverCenter')}</span>
                    </button>
                  )}

                  {user?.role !== 'driver' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenRegisterModal();
                      }}
                      className="w-full h-10 border border-emerald-300 dark:border-emerald-800 bg-[#E8F9EE] dark:bg-emerald-950/60 hover:bg-[#d8f5e2] text-emerald-800 dark:text-emerald-200 rounded-none text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] bg-[#06C755] text-white px-1 font-bold">ฟรี</span>
                      <span>{t('nav.driverJoin')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
};
