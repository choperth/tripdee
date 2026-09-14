'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Plus, Sun, Moon, CarFront, KeyRound, BedDouble, Briefcase, UserCheck, LogIn, Crown, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { DictKey } from '@/i18n/dictionaries';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPortal: () => void;
}

const TABS = [
  { id: 'van', labelKey: 'nav.van' as DictKey, icon: CarFront },
  { id: 'car', labelKey: 'nav.car' as DictKey, icon: KeyRound },
  { id: 'hotel', labelKey: 'nav.hotel' as DictKey, icon: BedDouble },
  { id: 'corporate', labelKey: 'nav.corp' as DictKey, icon: Briefcase },
] as const;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenPortal,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [compact, setCompact] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const lastY = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('td-theme');
      if (saved === 'dark') {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (dismissed) {
        setCompact(false);
        lastY.current = y;
        return;
      }
      if (y <= 0) {
        setCompact(false);
      } else if (y > 60 && y > lastY.current + 4) {
        setCompact(true);
      } else if (y < lastY.current - 8) {
        setCompact(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  useEffect(() => {
    const root = document.documentElement;
    if (dismissed) {
      root.setAttribute('data-nav', 'dismissed');
    } else if (compact) {
      root.setAttribute('data-nav', 'compact');
    } else {
      root.removeAttribute('data-nav');
    }
  }, [dismissed, compact]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('td-theme', next);
    } catch {}
  };

  const pick = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-200 transition-transform duration-300 ease-out ${
        compact && !dismissed ? '-translate-y-[var(--td-banner-h)]' : 'translate-y-0'
      }`}
    >
      {/* Top Banner */}
      {!dismissed && (
        <div role="region" aria-label={t('nav.promo')} className="flex h-[var(--td-banner-h)] items-center justify-between gap-2 bg-slate-900 text-white px-4 text-xs font-semibold">
          <div className="mx-auto flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex h-2 w-2 rounded-full bg-leaf animate-pulse" />
            <span>{t('nav.promo')}</span>
            <button onClick={onOpenRegisterModal} className="font-extrabold text-blue-400 hover:text-blue-300 underline underline-offset-2">
              {t('nav.promoCta')}
            </button>
          </div>
          <button
            onClick={() => {
              setDismissed(true);
              setCompact(false);
            }}
            aria-label={t('nav.promoClose')}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <nav
        aria-label={t('nav.main')}
        className={`border-b bg-card/95 backdrop-blur-md transition-colors ${
          scrolled ? 'border-rule shadow-xs' : 'border-rule/80'
        }`}
      >
        <div className="mx-auto flex h-[var(--td-bar-h)] w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => pick('van')}
              className="flex shrink-0 items-center gap-1.5 font-display text-xl font-extrabold tracking-tight text-ink"
              aria-label={t('nav.home')}
            >
              <span>TripDee</span>
              <span className="inline-flex items-center rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-extrabold text-accent border border-accent/20">
                เชียงใหม่
              </span>
            </button>

            {/* Desktop Navigation Tabs */}
            <ul className="hidden items-center gap-1 md:flex">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => pick(tab.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-input px-3.5 py-2 text-xs font-bold transition-colors ${
                        active
                          ? 'bg-accent-soft text-accent border border-accent/20'
                          : 'text-ink-2 hover:bg-paper hover:text-ink'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
                      <span>{t(tab.labelKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Action Icons & CTAs */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-input text-ink-2 transition-colors hover:bg-paper hover:text-ink border border-rule/60"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Auth or Login Button */}
            {user ? (
              <button
                onClick={onOpenPortal}
                className="hidden shrink-0 items-center gap-1.5 rounded-input bg-accent text-white px-3 py-2 text-xs font-bold shadow-xs hover:bg-accent-deep md:inline-flex"
              >
                {user.role === 'driver' && <CarFront className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {user.role === 'customer' && <Briefcase className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {user.role === 'admin' && <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />}

                <span className="max-w-[120px] truncate">
                  {user.role === 'driver' && (user.driverNickname || user.name)}
                  {user.role === 'customer' && (user.companyName || user.name)}
                  {user.role === 'admin' && t('nav.admin')}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="hidden shrink-0 items-center gap-1 rounded-input border border-rule bg-paper px-3 py-2 text-xs font-bold text-ink hover:bg-paper-2 md:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Register Free Driver Button */}
            <button
              onClick={onOpenRegisterModal}
              className="hidden shrink-0 items-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors md:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              <span>{t('nav.registerFree')}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-input text-ink border border-rule md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="border-t border-rule bg-card p-3 md:hidden shadow-lg">
            <ul className="flex flex-col gap-1.5">
              <li>
                <LanguageSwitcher variant="row" onPick={() => setMenuOpen(false)} />
              </li>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => pick(tab.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex w-full items-center gap-2 rounded-input px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                        active
                          ? 'bg-accent text-white'
                          : 'text-ink hover:bg-paper'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                      <span>{t(tab.labelKey)}</span>
                    </button>
                  </li>
                );
              })}

              <li className="pt-2 border-t border-rule flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPortal();
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-input bg-accent text-white py-2.5 text-xs font-bold"
                  >
                    <span>{t('nav.dashboard', { name: user.driverNickname || user.companyName || user.name })}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-input border border-rule bg-paper py-2.5 text-xs font-bold text-ink"
                  >
                    <LogIn className="h-4 w-4 text-accent" />
                    <span>{t('nav.login')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenRegisterModal();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep py-2.5 text-xs font-bold text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('nav.registerFree')}</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};
