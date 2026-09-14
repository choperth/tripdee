'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DictKey, Locale, LOCALES, dictionaries } from '@/i18n/dictionaries';

const STORAGE_KEY = 'td-lang';

type Vars = Record<string, string | number>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictKey, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const isLocale = (v: string | null): v is Locale =>
  v !== null && LOCALES.some((l) => l.code === v);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('th');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved) && saved !== 'th') {
        setLocaleState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const meta = LOCALES.find((l) => l.code === locale);
    if (meta) document.documentElement.lang = meta.htmlLang;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Vars): string => {
      let s: string = dictionaries[locale][key] ?? dictionaries.th[key];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
