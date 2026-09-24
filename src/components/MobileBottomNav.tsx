'use client';

import React from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';

interface MobileBottomNavProps {
  onSelectTab?: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onSelectTab }) => {
  const scrollTo = (id: string, tab?: string) => {
    if (tab && onSelectTab) {
      onSelectTab(tab);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-150 bg-paper-elevated/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-border-subtle/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 items-center h-14 px-1 max-w-lg mx-auto">
        {/* 1. Vehicles / Home */}
        <button
          type="button"
          onClick={() => scrollTo('results', 'van')}
          className="flex flex-col items-center justify-center gap-0.5 h-full py-1 text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">airport_shuttle</span>
          <span className="text-[10px] font-bold tracking-tight">ค้นหารถ</span>
        </button>

        {/* 2. TripBoard */}
        <button
          type="button"
          onClick={() => scrollTo('tripboard')}
          className="flex flex-col items-center justify-center gap-0.5 h-full py-1 text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span className="text-[10px] font-bold tracking-tight">TripBoard</span>
        </button>

        {/* 3. Corporate */}
        <button
          type="button"
          onClick={() => scrollTo('corporate', 'corporate')}
          className="flex flex-col items-center justify-center gap-0.5 h-full py-1 text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
          <span className="text-[10px] font-bold tracking-tight">องค์กร</span>
        </button>

        {/* 4. Official LINE */}
        <a
          href={OFFICIAL_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 h-full py-1 text-line-green hover:text-line-green-hover active:scale-95 transition-all cursor-pointer"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-line-green ring-2 ring-white dark:ring-slate-950" />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">ทัก LINE</span>
        </a>
      </div>
    </nav>
  );
};
