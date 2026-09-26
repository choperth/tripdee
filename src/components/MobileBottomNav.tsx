'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';

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
  const [activeSection, setActiveSection] = useState<'results' | 'tripboard' | 'corporate' | 'hotel'>(() => {
    if (activeTab === 'corporate') return 'corporate';
    if (activeTab === 'hotel') return 'hotel';
    return 'results';
  });

  // Synchronize activeSection whenever activeTab changes externally
  useEffect(() => {
    if (activeTab === 'corporate') {
      setActiveSection('corporate');
    } else if (activeTab === 'hotel') {
      setActiveSection('hotel');
    } else {
      // Vehicle tab view: check if scrolled to tripboard
      const tripboardEl = document.getElementById('tripboard');
      if (tripboardEl) {
        const rect = tripboardEl.getBoundingClientRect();
        if (rect.top <= 250 && rect.bottom >= 120) {
          setActiveSection('tripboard');
          return;
        }
      }
      setActiveSection('results');
    }
  }, [activeTab]);

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-paper-elevated/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-border-subtle/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 items-stretch h-14 max-w-lg mx-auto select-none touch-manipulation">
        {/* 1. Vehicles / Home */}
        <button
          type="button"
          onClick={() => handleNavigate('results', 'van')}
          aria-label="ค้นหารถ"
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation ${
            isResultsActive
              ? 'text-blue-action dark:text-blue-400 font-extrabold'
              : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px] transition-transform"
            style={{ fontVariationSettings: isResultsActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            airport_shuttle
          </span>
          <span className="text-[10px] tracking-tight">ค้นหารถ</span>
          {isResultsActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-action dark:bg-blue-400 -mt-0.5" />
          )}
        </button>

        {/* 2. TripBoard */}
        <button
          type="button"
          onClick={() => handleNavigate('tripboard', 'van')}
          aria-label="TripBoard"
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation ${
            isTripBoardActive
              ? 'text-blue-action dark:text-blue-400 font-extrabold'
              : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px] transition-transform"
            style={{ fontVariationSettings: isTripBoardActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            forum
          </span>
          <span className="text-[10px] tracking-tight">TripBoard</span>
          {isTripBoardActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-action dark:bg-blue-400 -mt-0.5" />
          )}
        </button>

        {/* 3. Corporate */}
        <button
          type="button"
          onClick={() => handleNavigate('corporate', 'corporate')}
          aria-label="บริการองค์กร"
          className={`flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 cursor-pointer transition-all active:scale-95 touch-manipulation ${
            isCorporateActive
              ? 'text-blue-action dark:text-blue-400 font-extrabold'
              : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px] transition-transform"
            style={{ fontVariationSettings: isCorporateActive ? '"FILL" 1' : '"FILL" 0' }}
          >
            corporate_fare
          </span>
          <span className="text-[10px] tracking-tight">องค์กร</span>
          {isCorporateActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-action dark:bg-blue-400 -mt-0.5" />
          )}
        </button>

        {/* 4. Official LINE */}
        <a
          href={OFFICIAL_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ติดต่อ LINE TripDee"
          className="flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 text-line-green hover:text-line-green-hover active:scale-95 transition-all cursor-pointer touch-manipulation"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[22px]">chat</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-line-green ring-2 ring-white dark:ring-slate-950 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">ทัก LINE</span>
        </a>
      </div>
    </nav>
  );
};
