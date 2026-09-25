'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu,
  X,
  Sun,
  Moon,
  CarFront,
  Briefcase,
  User,
  Crown,
  PlusCircle,
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('td-theme');
      if (saved === 'dark') {
        queueMicrotask(() => {
          setTheme('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.add('dark');
        });
      }
    } catch {}
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

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('td-theme', next);
    } catch {}
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
    const el = document.getElementById('results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-200">
      {/* MAIN NAVBAR (Stitch Glassmorphism & Navy Accents) */}
      <nav
        aria-label={t('nav.main')}
        className={`w-full bg-paper-elevated/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border-subtle dark:border-slate-800 transition-all ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-3 sm:px-margin lg:px-gutter flex items-center justify-between gap-1.5 sm:gap-space-md">
          {/* LEFT: Official Logo */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className="flex shrink-0 items-center py-1 transition-transform hover:scale-[1.02] focus:outline-none cursor-pointer"
              aria-label={t('nav.home')}
            >
              <Image
                src="/logo.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 sm:h-9 w-auto object-contain block dark:hidden"
                priority
              />
              <Image
                src="/logo-white.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 sm:h-9 w-auto object-contain hidden dark:block"
                priority
              />
            </button>
          </div>

          {/* CENTER: Navigation Links (balanced & centered) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 px-2">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className={`transition-colors text-xs xl:text-sm font-bold rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap ${
                activeTab === 'van'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.van')}
            </button>
            <button
              type="button"
              onClick={() => selectTab('suv_driver')}
              className={`transition-colors text-xs xl:text-sm font-bold rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap ${
                activeTab === 'suv_driver'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.suvDriverShort')}
            </button>
            <button
              type="button"
              onClick={() => selectTab('car')}
              className={`transition-colors text-xs xl:text-sm font-bold rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap ${
                activeTab === 'car'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.car')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('tripboard')}
              className="text-xs xl:text-sm font-bold text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap"
            >
              {t('nav.tripboardShort')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('routes')}
              className="text-xs xl:text-sm font-bold text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap"
            >
              {t('nav.routesShort')}
            </button>
            <button
              type="button"
              onClick={() => {
                selectTab('corporate');
                scrollTo('corporate');
              }}
              className={`transition-colors text-xs xl:text-sm font-bold rounded-lg px-2.5 xl:px-3 py-1.5 whitespace-nowrap ${
                activeTab === 'corporate'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.b2bShort')}
            </button>
          </div>

          {/* RIGHT: Actions, Language Switcher, Driver Portal, Customer Post CTA */}
          <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-2 min-w-0">
            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}
              className="hidden sm:flex p-2 rounded-lg text-ink-secondary hover:text-navy-deep hover:bg-paper-surface-muted dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-accent" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Driver Portal CTA */}
            {onOpenDriverSelfService && (
              <button
                type="button"
                onClick={onOpenDriverSelfService}
                className="hidden xl:inline-flex items-center gap-1.5 bg-paper-surface-muted hover:bg-surface-variant dark:bg-slate-900 dark:hover:bg-slate-800 text-navy-deep dark:text-slate-200 text-xs xl:text-sm font-bold px-3 py-1.5 rounded-lg border border-border-subtle dark:border-slate-700 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
                title={t('nav.driverCta')}
              >
                <span className="material-symbols-outlined text-[17px] text-amber-accent">
                  airport_shuttle
                </span>
                <span>{t('nav.driverCtaShort')}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-verified-emerald-soft text-verified-emerald text-[10px] font-extrabold">
                  {t('nav.free')}
                </span>
              </button>
            )}

            {/* Customer Post Request Button (Stitch Action) */}
            <button
              type="button"
              onClick={() => {
                scrollTo('tripboard');
                const trigger = document.getElementById('open-post-modal-btn');
                if (trigger) trigger.click();
              }}
              aria-label={t('nav.postJobShort')}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-blue-action hover:bg-blue-action-hover text-on-primary font-bold p-2 xs:px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] whitespace-nowrap text-xs sm:text-sm"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">{t('nav.postJobShort')}</span>
            </button>

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
                className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-navy-deep text-surface hover:bg-navy-surface transition-all shrink-0"
              >
                {user.role === 'driver' && <CarFront className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                {user.role === 'customer' && <Briefcase className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                {user.role === 'admin' && <Crown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                <span className="hidden sm:inline max-w-[85px] truncate">
                  {user.role === 'driver' && (user.driverNickname || user.name)}
                  {user.role === 'customer' && (user.companyName || user.name)}
                  {user.role === 'admin' && t('nav.admin')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold border border-border-subtle dark:border-slate-700 bg-card hover:bg-paper-surface-muted text-navy-deep dark:text-slate-100 transition-colors shadow-sm shrink-0"
                aria-label={t('nav.login')}
              >
                <User className="w-4 h-4 text-ink-secondary" />
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
            <div className="flex items-center justify-between gap-2 pb-space-xs border-b border-border-subtle dark:border-slate-800">
              <div className="flex-1">
                <LanguageSwitcher variant="row" onPick={() => setMenuOpen(false)} />
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}
                className="h-9 px-2.5 rounded-xl bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200 font-body-medium text-xs flex items-center gap-1.5 shrink-0"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-accent" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span className="hidden xs:inline">{theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}</span>
              </button>
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
                  scrollTo('tripboard');
                }}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                📋 {t('nav.boardJobs')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollTo('routes');
                }}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                🗺️ {t('nav.routesPopular')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  scrollTo('corporate');
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
