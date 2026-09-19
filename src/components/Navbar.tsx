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
  const [dismissed, setDismissed] = useState(false);
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
      {/* 1. TOP ANNOUNCEMENT RIBBON (Stitch Theme) */}
      {!dismissed && (
        <div className="bg-primary-container text-surface px-margin py-space-xs transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between font-body-subtext text-body-subtext">
            <div className="flex items-center gap-space-sm overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
              <span className="material-symbols-outlined text-[16px] text-taxi-yellow-30 shrink-0">
                airport_shuttle
              </span>
              <span className="truncate">
                🚐 {t('nav.promo')}
              </span>
            </div>
            <div className="flex items-center gap-space-md shrink-0">
              <a
                href="https://line.me/R/ti/p/@tripdee"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-blue-subtle hover:text-white font-bold transition-colors"
              >
                <span>{t('nav.lineCoord')}</span>
              </a>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label={t('nav.promoClose')}
                className="text-surface/70 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVBAR (Stitch Glassmorphism & Navy Accents) */}
      <nav
        aria-label={t('nav.main')}
        className={`w-full bg-paper-elevated/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border-subtle dark:border-slate-800 transition-all ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-margin lg:px-gutter flex items-center justify-between gap-space-md">
          {/* LEFT: Official Logo */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className="flex shrink-0 items-center py-1 transition-transform hover:scale-[1.02] focus:outline-none cursor-pointer"
              aria-label={t('nav.home')}
            >
              <Image
                src="/logo.png"
                alt="TripDee ทริปดี"
                width={140}
                height={36}
                className="h-8 sm:h-9 w-auto object-contain block dark:hidden"
                priority
              />
              <Image
                src="/logo-white.png"
                alt="TripDee ทริปดี"
                width={140}
                height={36}
                className="h-8 sm:h-9 w-auto object-contain hidden dark:block"
                priority
              />
            </button>
          </div>

          {/* CENTER: Navigation Links */}
          <div className="hidden lg:flex items-center gap-space-xs xl:gap-space-sm">
            <button
              type="button"
              onClick={() => selectTab('van')}
              className={`transition-colors font-body-medium text-body-medium rounded-lg px-space-sm py-space-xs ${
                activeTab === 'van'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white font-bold shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.van')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('tripboard')}
              className="font-body-medium text-body-medium text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg px-space-sm py-space-xs"
            >
              {t('nav.tripboard')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('routes')}
              className="font-body-medium text-body-medium text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg px-space-sm py-space-xs"
            >
              {t('nav.routes')}
            </button>
            <button
              type="button"
              onClick={() => {
                selectTab('corporate');
                scrollTo('corporate');
              }}
              className={`transition-colors font-body-medium text-body-medium rounded-lg px-space-sm py-space-xs ${
                activeTab === 'corporate'
                  ? 'bg-surface-container text-navy-deep dark:bg-slate-800 dark:text-white font-bold shadow-xs'
                  : 'text-ink-secondary hover:text-navy-deep dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t('nav.b2b')}
            </button>
          </div>

          {/* RIGHT: Actions, Language Switcher, Driver Portal, Customer Post CTA */}
          <div className="flex items-center gap-space-xs sm:gap-space-sm">
            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}
              className="p-2 rounded-lg text-ink-secondary hover:text-navy-deep hover:bg-paper-surface-muted dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
                className="hidden md:inline-flex items-center gap-space-2xs bg-paper-surface-muted hover:bg-surface-variant dark:bg-slate-900 dark:hover:bg-slate-800 text-navy-deep dark:text-slate-200 font-body-medium text-body-medium px-space-sm py-space-xs rounded-lg border border-border-subtle dark:border-slate-700 shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-accent">
                  airport_shuttle
                </span>
                <span className="font-bold whitespace-nowrap">{t('nav.driverCta')}</span>
                <span className="px-space-xs py-0.5 rounded-full bg-verified-emerald-soft text-verified-emerald font-label-badge text-[10px] font-bold">
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
              className="inline-flex items-center gap-space-2xs bg-blue-action hover:bg-blue-action-hover text-on-primary font-body-medium text-body-medium px-space-sm sm:px-space-md py-space-xs rounded-lg shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.postJob')}</span>
              <span className="sm:hidden">{t('nav.postJobShort')}</span>
            </button>

            {/* User Login/Portal */}
            {user ? (
              <button
                type="button"
                onClick={onOpenPortal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-deep text-surface hover:bg-navy-surface transition-all"
              >
                {user.role === 'driver' && <CarFront className="h-3.5 w-3.5" />}
                {user.role === 'customer' && <Briefcase className="h-3.5 w-3.5" />}
                {user.role === 'admin' && <Crown className="h-3.5 w-3.5" />}
                <span className="max-w-[90px] truncate">
                  {user.role === 'driver' && (user.driverNickname || user.name)}
                  {user.role === 'customer' && (user.companyName || user.name)}
                  {user.role === 'admin' && t('nav.admin')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="w-9 h-9 rounded-full bg-navy-deep text-surface hover:bg-navy-surface flex items-center justify-center transition-colors shadow-sm"
                aria-label={t('nav.login')}
                title={t('nav.login')}
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-ink-primary dark:text-slate-200 hover:bg-paper-surface-muted transition-colors"
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {menuOpen && (
          <div className="lg:hidden bg-paper-elevated dark:bg-slate-900 border-b border-border-subtle px-margin py-space-md space-y-space-sm shadow-xl">
            <div className="grid grid-cols-2 gap-space-xs pb-space-xs">
              <button
                type="button"
                onClick={() => selectTab('van')}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 ${
                  activeTab === 'van'
                    ? 'bg-blue-subtle text-blue-action font-bold'
                    : 'bg-paper-surface-muted text-ink-primary'
                }`}
              >
                <span>🚐</span>
                <span>{t('nav.van')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  selectTab('corporate');
                  scrollTo('corporate');
                }}
                className={`px-space-md py-space-sm rounded-xl font-body-medium text-body-medium text-left flex items-center gap-2 ${
                  activeTab === 'corporate'
                    ? 'bg-blue-subtle text-blue-action font-bold'
                    : 'bg-paper-surface-muted text-ink-primary'
                }`}
              >
                <span>🏢</span>
                <span>{t('nav.b2b')}</span>
              </button>
            </div>

            <div className="flex flex-col gap-1 border-t border-border-subtle pt-space-xs">
              <button
                type="button"
                onClick={() => scrollTo('tripboard')}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary hover:bg-paper-surface-muted transition-colors"
              >
                📋 {t('nav.boardJobs')}
              </button>
              <button
                type="button"
                onClick={() => scrollTo('routes')}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary hover:bg-paper-surface-muted transition-colors"
              >
                🗺️ {t('nav.routesPopular')}
              </button>
              <button
                type="button"
                onClick={() => scrollTo('corporate')}
                className="py-2.5 px-3 rounded-lg text-left font-body-medium text-ink-primary hover:bg-paper-surface-muted transition-colors"
              >
                🏢 {t('nav.corpService')}
              </button>
            </div>

            <div className="border-t border-border-subtle pt-space-sm flex flex-col gap-space-xs">
              {onOpenDriverSelfService && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDriverSelfService();
                  }}
                  className="w-full h-11 bg-navy-deep text-surface rounded-xl font-body-medium flex items-center justify-center gap-2"
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
                className="w-full h-10 border border-border-subtle rounded-xl text-ink-primary font-body-medium text-center hover:bg-paper-surface-muted"
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
