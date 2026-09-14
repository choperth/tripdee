'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Plus, Sun, Moon, CarFront, KeyRound, BedDouble, Briefcase, UserCheck, LogIn, Crown } from 'lucide-react';
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
  { id: 'van', labelKey: 'nav.van' as DictKey, icon: CarFront, active: 'bg-accent text-accent-ink' },
  { id: 'car', labelKey: 'nav.car' as DictKey, icon: KeyRound, active: 'bg-sky text-white' },
  { id: 'hotel', labelKey: 'nav.hotel' as DictKey, icon: BedDouble, active: 'bg-berry text-white' },
  { id: 'corporate', labelKey: 'nav.corp' as DictKey, icon: Briefcase, active: 'bg-grape text-white' },
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
      const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = preferred;
      setTheme(preferred === 'dark' ? 'dark' : 'light');
    } catch {
      setTheme('light');
    }
  }, []);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 8);
      if (!dismissed) {
        if (y > 120 && y > lastY.current + 4) setCompact(true);
        else if (y < lastY.current - 4 || y <= 120) setCompact(false);
      }
      lastY.current = y;
      ticking = false;
    };
    const handler = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', handler);
  }, [dismissed]);

  useEffect(() => {
    document.documentElement.dataset.nav = dismissed ? 'dismissed' : compact ? 'compact' : '';
    return () => {
      document.documentElement.dataset.nav = '';
    };
  }, [dismissed, compact]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('td-theme', next);
    } catch {
      /* private mode */
    }
  };

  const pick = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-200 transition-transform duration-420 ease-out ${
        compact && !dismissed ? '-translate-y-[var(--td-banner-h)]' : 'translate-y-0'
      }`}
    >
      {!dismissed && (
        <div role="region" aria-label={t('nav.promo')} className="flex h-[var(--td-banner-h)] items-center justify-center gap-2 bg-coral px-4 text-center text-[13px] font-bold text-ink">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap">
            {t('nav.promo')}{' '}
            <button onClick={onOpenRegisterModal} className="td-navlink font-extrabold underline underline-offset-4">
              {t('nav.promoCta')}
            </button>
          </p>
          <button
            onClick={() => {
              setDismissed(true);
              setCompact(false);
            }}
            aria-label={t('nav.promoClose')}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
          >
            <X className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
          </button>
        </div>
      )}

      <nav
        aria-label={t('nav.main')}
        className={`td-glass border-b bg-paper/85 backdrop-blur-[14px] backdrop-saturate-[1.2] ${
          scrolled ? 'border-rule' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex h-[var(--td-bar-h)] w-full max-w-6xl items-center gap-1 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => pick('van')}
            className="td-navlink mr-auto flex shrink-0 items-center gap-1 font-display text-lg font-extrabold tracking-tight text-ink"
            aria-label={t('nav.home')}
          >
            TripDee
            <span aria-hidden="true" className="td-dot inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          </button>

          {/* Desktop tabs */}
          <ul className="hidden items-center gap-1 md:flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => pick(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`td-tab inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-[13px] transition duration-220 ease-out ${
                      active
                        ? `${tab.active} font-extrabold`
                        : 'font-bold text-ink-2 hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                    {t(tab.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('nav.toLight') : t('nav.toDark')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 transition duration-220 ease-out hover:bg-paper-2 hover:text-ink"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <LanguageSwitcher />

          {/* Auth State Button */}
          {user ? (
            <button
              onClick={onOpenPortal}
              className={`td-btn td-pop hidden shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 text-xs font-extrabold md:inline-flex ${
                user.role === 'driver'
                  ? 'bg-accent text-accent-ink'
                  : user.role === 'customer'
                  ? 'bg-grape text-white'
                  : 'bg-sun text-sun-ink'
              }`}
            >
              {user.role === 'driver' && <CarFront className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {user.role === 'customer' && <Briefcase className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {user.role === 'admin' && <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />}

              <span className="max-w-[120px] truncate">
                {user.role === 'driver' && (user.driverNickname || user.name)}
                {user.role === 'customer' && (user.companyName || user.name)}
                {user.role === 'admin' && t('nav.admin')}
              </span>

              {user.role === 'driver' && (
                <span
                  className={`h-2 w-2 rounded-full ${user.isAvailable ? 'bg-leaf animate-pulse' : 'bg-berry'}`}
                  title={user.isAvailable ? t('nav.available') : t('nav.busy')}
                />
              )}
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="td-btn hidden shrink-0 items-center gap-1 rounded-pill bg-paper-2 px-3.5 py-2 text-[13px] font-extrabold text-ink transition duration-220 ease-out hover:bg-card md:inline-flex"
            >
              <LogIn className="h-4 w-4 text-accent-deep" strokeWidth={2.5} />
              <span>{t('nav.login')}</span>
            </button>
          )}

          {/* Register Free Vehicle Button */}
          <button
            onClick={onOpenRegisterModal}
            className="td-btn td-pop hidden shrink-0 items-center gap-1 rounded-pill bg-sun px-3.5 py-2 text-[13px] font-extrabold text-sun-ink md:inline-flex"
          >
            <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
            {t('nav.registerFree')}
          </button>

          {/* Mobile disclosure */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition duration-220 ease-out hover:bg-paper-2 md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="td-elev-lift mx-4 mb-3 rounded-card bg-card p-2 md:hidden">
            <ul className="flex flex-col gap-1">
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
                      className={`td-tab inline-flex w-full items-center gap-2.5 rounded-input px-3 py-2.5 text-left text-sm transition duration-220 ease-out ${
                        active
                          ? `${tab.active} font-extrabold`
                          : 'font-bold text-ink hover:bg-paper-2'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
                      {t(tab.labelKey)}
                    </button>
                  </li>
                );
              })}

              <li className="mt-1 space-y-1.5 border-t-2 border-dashed border-rule pt-2">
                {user ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPortal();
                    }}
                    className="td-btn flex w-full items-center justify-center gap-1.5 rounded-input bg-accent py-2.5 text-sm font-extrabold text-accent-ink"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>{t('nav.dashboard', { name: user.name })}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="td-btn flex w-full items-center justify-center gap-1.5 rounded-input bg-paper-2 py-2.5 text-sm font-extrabold text-ink"
                  >
                    <LogIn className="h-4 w-4 text-accent-deep" />
                    <span>{t('nav.loginMobile')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenRegisterModal();
                  }}
                  className="td-btn td-pop flex w-full items-center justify-center gap-1.5 rounded-input bg-sun py-2.5 text-sm font-extrabold text-sun-ink"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
                  {t('nav.registerFree')}
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};
