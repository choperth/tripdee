'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';

interface MobileBottomNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onNavigate?: (sectionId: string, requiredTab?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = 'van',
  onSelectTab,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<'results' | 'tripboard' | 'corporate' | 'hotel'>(() => {
    if (activeTab === 'corporate') return 'corporate';
    if (activeTab === 'hotel') return 'hotel';
    return 'results';
  });

  const [prevTab, setPrevTab] = useState(activeTab);

  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    if (activeTab === 'corporate') {
      setActiveSection('corporate');
    } else if (activeTab === 'hotel') {
      setActiveSection('hotel');
    } else {
      setActiveSection('results');
    }
  }

  // Scroll spy on mobile to automatically highlight TripBoard vs Vehicles when scrolling
  useEffect(() => {
    if (activeTab === 'corporate' || activeTab === 'hotel') return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const tripboardEl = document.getElementById('tripboard');
          if (tripboardEl) {
            const rect = tripboardEl.getBoundingClientRect();
            if (rect.top <= 250 && rect.bottom >= 120) {
              setActiveSection('tripboard');
              ticking = false;
              return;
            }
          }
          setActiveSection('results');
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const handleNavigate = useCallback(
    (id: string, requiredTab?: string) => {
      if (id === 'tripboard') {
        setActiveSection('tripboard');
      } else if (id === 'results') {
        setActiveSection('results');
      } else if (id === 'corporate') {
        setActiveSection('corporate');
      }

      if (onNavigate) {
        onNavigate(id, requiredTab);
        return;
      }

      // Fallback navigation with retry for DOM mount after tab change
      const targetTab = requiredTab || (id === 'corporate' ? 'corporate' : 'van');
      if (targetTab && onSelectTab && activeTab !== targetTab) {
        onSelectTab(targetTab);
      }

      if (id === 'corporate' && targetTab === 'corporate') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      let attempts = 0;
      const tryScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 15) {
          attempts++;
          setTimeout(tryScroll, 40);
        }
      };
      requestAnimationFrame(tryScroll);
    },
    [activeTab, onNavigate, onSelectTab]
  );

  const isResultsActive = activeTab !== 'corporate' && activeTab !== 'hotel' && activeSection === 'results';
  const isTripBoardActive = activeTab !== 'corporate' && activeTab !== 'hotel' && activeSection === 'tripboard';
  const isCorporateActive = activeTab === 'corporate';

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-sm pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 items-stretch h-14 max-w-lg mx-auto select-none touch-manipulation">
        {/* 1. Vehicles / Home */}
        <button
          type="button"
          onClick={() => handleNavigate('results', 'van')}
          aria-label={t('mnav.search')}
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation rounded-none ${
            isResultsActive
              ? 'text-slate-950 dark:text-white font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform"
            style={{ fontVariationSettings: isResultsActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            airport_shuttle
          </span>
          <span className="text-[10px] tracking-tight">{t('mnav.search')}</span>
          {isResultsActive && (
            <span className="w-3 h-0.5 bg-amber-500 rounded-none -mt-0.5" />
          )}
        </button>

        {/* 2. TripBoard */}
        <button
          type="button"
          onClick={() => handleNavigate('tripboard', 'van')}
          aria-label="TripBoard"
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation rounded-none ${
            isTripBoardActive
              ? 'text-slate-950 dark:text-white font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform"
            style={{ fontVariationSettings: isTripBoardActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            forum
          </span>
          <span className="text-[10px] tracking-tight">TripBoard</span>
          {isTripBoardActive && (
            <span className="w-3 h-0.5 bg-amber-500 rounded-none -mt-0.5" />
          )}
        </button>

        {/* 3. Corporate */}
        <button
          type="button"
          onClick={() => handleNavigate('corporate', 'corporate')}
          aria-label={t('mnav.corpAria')}
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation rounded-none ${
            isCorporateActive
              ? 'text-slate-950 dark:text-white font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform"
            style={{ fontVariationSettings: isCorporateActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            corporate_fare
          </span>
          <span className="text-[10px] tracking-tight">{t('mnav.corp')}</span>
          {isCorporateActive && (
            <span className="w-3 h-0.5 bg-amber-500 rounded-none -mt-0.5" />
          )}
        </button>

        {/* 4. Official LINE */}
        <a
          href={OFFICIAL_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('mnav.lineAria')}
          className="flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 text-[#06C755] hover:text-[#05b04b] active:scale-95 transition-all cursor-pointer touch-manipulation rounded-none"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#06C755] ring-1 ring-white dark:ring-slate-950" />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">{t('mnav.line')}</span>
        </a>
      </div>
    </nav>
  );
};
