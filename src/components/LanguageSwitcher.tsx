'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LOCALES } from '@/i18n/dictionaries';

interface LanguageSwitcherProps {
  /** 'pill' for navbar bars, 'row' for full-width mobile menus */
  variant?: 'pill' | 'row';
  onPick?: () => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  onPick,
}) => {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-1 rounded-input bg-paper-2 p-1" role="group" aria-label={t('lang.switch')}>
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                onPick?.();
              }}
              aria-pressed={active}
              className={`flex-1 rounded-lg px-2 py-2 text-[13px] font-extrabold transition duration-220 ease-out ${
                active ? 'bg-card text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('lang.switch')}
        className="inline-flex items-center gap-0.5 sm:gap-1 rounded-pill px-1.5 sm:px-2.5 py-1 sm:py-2 text-xs sm:text-[13px] font-extrabold text-ink-2 transition duration-220 ease-out hover:bg-paper-2 hover:text-ink"
      >
        <Globe className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
        <span>{current.short}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-220 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
          strokeWidth={3}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.switch')}
          className="td-elev-lift absolute right-0 top-full z-300 mt-2 w-36 overflow-hidden rounded-card bg-card p-1.5"
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                    onPick?.();
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-input px-3 py-2.5 text-left text-sm transition duration-220 ease-out ${
                    active ? 'bg-paper-2 font-extrabold text-ink' : 'font-bold text-ink-2 hover:bg-paper-2 hover:text-ink'
                  }`}
                >
                  <span>{l.label}</span>
                  {active && <Check className="h-4 w-4 text-leaf" aria-hidden="true" strokeWidth={3} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
