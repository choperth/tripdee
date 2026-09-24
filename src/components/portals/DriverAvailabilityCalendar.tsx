'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarCheck,
  AlertCircle,
  X,
  Clock,
} from 'lucide-react';
import {
  toISODateString,
  getUpcomingBusyRanges,
  generateDateRange,
} from '@/lib/availabilityUtils';
import { useLanguage } from '@/context/LanguageContext';

export interface DriverAvailabilityCalendarProps {
  busyDates: string[];
  onChange: (newBusyDates: string[]) => void;
  className?: string;
}

export const DriverAvailabilityCalendar: React.FC<DriverAvailabilityCalendarProps> = ({
  busyDates = [],
  onChange,
  className = '',
}) => {
  const { t, locale } = useLanguage();
  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [rangeError, setRangeError] = useState<string>('');

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Calendar Grid calculations
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayIso = toISODateString(today);

  // Toggle single date
  const toggleDate = (isoString: string) => {
    if (isoString < todayIso) return; // Ignore past dates
    if (busyDates.includes(isoString)) {
      onChange(busyDates.filter((d) => d !== isoString));
    } else {
      onChange([...busyDates, isoString].sort());
    }
  };

  // Add range of dates
  const handleAddRange = (e: React.FormEvent) => {
    e.preventDefault();
    setRangeError('');

    if (!rangeStart || !rangeEnd) {
      setRangeError(t('cal.errBothDates'));
      return;
    }

    if (rangeStart < todayIso && rangeEnd < todayIso) {
      setRangeError(t('cal.errPastRange'));
      return;
    }

    const newDates = generateDateRange(rangeStart, rangeEnd).filter((d) => d >= todayIso);
    const merged = Array.from(new Set([...busyDates, ...newDates])).sort();
    onChange(merged);
    setRangeStart('');
    setRangeEnd('');
  };

  // Remove a contiguous range
  const handleRemoveRange = (startIso: string, endIso: string) => {
    const rangeToRemove = new Set(generateDateRange(startIso, endIso));
    const filtered = busyDates.filter((d) => !rangeToRemove.has(d));
    onChange(filtered);
  };

  // Clear all upcoming busy dates
  const handleClearAll = () => {
    if (busyDates.length === 0) return;
    if (confirm(t('cal.confirmClear'))) {
      onChange([]);
    }
  };

  const upcomingRanges = getUpcomingBusyRanges(busyDates, locale);

  const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesZh = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];

  const monthTitle =
    locale === 'en'
      ? `${monthNamesEn[currentMonth]} ${currentYear}`
      : locale === 'zh'
      ? `${currentYear}年 ${monthNamesZh[currentMonth]}`
      : `${monthNamesTh[currentMonth]} ${currentYear + 543}`;

  const dayHeadersTh = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const dayHeadersEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayHeadersZh = ['日', '一', '二', '三', '四', '五', '六'];
  const dayHeaders = locale === 'en' ? dayHeadersEn : locale === 'zh' ? dayHeadersZh : dayHeadersTh;

  return (
    <div className={`space-y-space-md text-left ${className}`}>
      {/* Header title */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-title-card text-title-card text-navy-deep dark:text-white font-bold flex items-center gap-2">
              <span>{t('cal.driverTitle')}</span>
              <span className="text-[11px] font-medium text-verified-emerald bg-verified-emerald-soft px-2 py-0.5 rounded-full">
                {t('cal.liveSyncBadge')}
              </span>
            </h4>
            <p className="text-xs text-ink-muted dark:text-slate-400">
              {t('cal.driverSubtitle')}
            </p>
          </div>
        </div>

        {upcomingRanges.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('cal.clearAll')}</span>
          </button>
        )}
      </div>

      {/* Active Upcoming Busy Ranges Summary */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-ink-muted dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('cal.upcomingRangesTitle', { count: upcomingRanges.length })}</span>
        </span>

        {upcomingRanges.length === 0 ? (
          <div className="p-3 rounded-xl bg-verified-emerald-soft/50 dark:bg-emerald-950/20 border border-verified-emerald/20 text-xs font-bold text-verified-emerald flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span>{t('cal.allDaysFree')}</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {upcomingRanges.map((range) => (
              <span
                key={`${range.startDate}-${range.endDate}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>
                  {range.label} ({range.count} {t('cal.unitDays')})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRange(range.startDate, range.endDate)}
                  aria-label={t('cal.removeRangeAria', { range: range.label })}
                  className="w-4 h-4 rounded-full bg-rose-200/80 dark:bg-rose-900/80 hover:bg-rose-300 dark:hover:bg-rose-800 text-rose-900 dark:text-white flex items-center justify-center transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Range Form */}
      <form
        onSubmit={handleAddRange}
        className="p-3.5 rounded-2xl bg-paper-surface-muted dark:bg-slate-800/80 border border-border-subtle dark:border-slate-700 space-y-2.5"
      >
        <span className="text-xs font-bold text-navy-deep dark:text-white block">
          {t('cal.quickRangeTitle')}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">
              {t('cal.fromDate')}
            </label>
            <input
              type="date"
              min={todayIso}
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 text-xs font-bold text-ink-primary dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">
              {t('cal.toDate')}
            </label>
            <input
              type="date"
              min={rangeStart || todayIso}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 text-xs font-bold text-ink-primary dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-deep font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('cal.markBusyBtn')}</span>
            </button>
          </div>
        </div>

        {rangeError && (
          <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{rangeError}</span>
          </p>
        )}
      </form>

      {/* Calendar Grid View */}
      <div className="p-4 rounded-2xl bg-paper-canvas dark:bg-slate-800/60 border border-border-subtle dark:border-slate-700 space-y-3">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-sm text-navy-deep dark:text-white">
            {monthTitle}
          </h5>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg border border-border-subtle dark:border-slate-700 hover:bg-paper-surface-muted dark:hover:bg-slate-700 flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg border border-border-subtle dark:border-slate-700 hover:bg-paper-surface-muted dark:hover:bg-slate-700 flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-ink-muted dark:text-slate-400">
          {dayHeaders.map((dh, i) => (
            <div key={dh} className={i === 0 || i === 6 ? 'text-rose-500/80' : ''}>
              {dh}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-11" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const iso = toISODateString(dateObj);
            const isPast = iso < todayIso;
            const isToday = iso === todayIso;
            const isBusy = busyDates.includes(iso);

            return (
              <button
                key={iso}
                type="button"
                disabled={isPast}
                onClick={() => toggleDate(iso)}
                className={`h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                  isPast
                    ? 'opacity-25 bg-transparent cursor-not-allowed text-ink-muted'
                    : isBusy
                    ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 ring-2 ring-rose-400/40'
                    : isToday
                    ? 'bg-blue-subtle dark:bg-blue-950/70 text-blue-action border-2 border-blue-action hover:bg-blue-100'
                    : 'bg-paper-elevated dark:bg-slate-900 border border-border-subtle/70 dark:border-slate-800 text-ink-primary dark:text-slate-200 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{dayNum}</span>
                {isBusy && (
                  <span className="text-[9px] font-extrabold tracking-tighter uppercase leading-none opacity-90">
                    {t('cal.cellBusy')}
                  </span>
                )}
                {isToday && !isBusy && (
                  <span className="text-[8px] font-bold text-blue-action leading-none">
                    {t('cal.cellToday')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-ink-muted dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-paper-elevated dark:bg-slate-900 border border-border-subtle" />
            <span>{t('cal.legendFree')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600" />
            <span className="text-rose-600 dark:text-rose-400 font-bold">{t('cal.legendBusy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-blue-action bg-blue-subtle" />
            <span>{t('cal.legendToday')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
