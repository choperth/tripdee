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
      <div className="flex items-center gap-1 rounded-none border border-slate-200 dark:border-slate-800 bg-paper-2 p-1" role="group" aria-label={t('lang.switch')}>
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
              className={`flex-1 rounded-none px-2 py-1.5 text-xs font-bold transition duration-150 cursor-pointer ${
                active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
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
        className="inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-none px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          className="absolute right-0 top-full z-300 mt-1 w-36 overflow-hidden rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md p-1"
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
                  className={`flex w-full items-center justify-between gap-2 rounded-none px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                    active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold' : 'font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
