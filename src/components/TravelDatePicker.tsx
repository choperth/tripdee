'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface TravelDatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  days?: number | string;
  onDaysChange?: (days: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** 'range' picks a start day + duration; 'single' only allows one calendar day */
  mode?: 'range' | 'single';
}

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const EN_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ZH_MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

const DAY_HEADERS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DAY_HEADERS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_HEADERS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a travel date or date range nicely
 */
function formatTravelRange(start: Date, end: Date, locale: string): string {
  const sy = start.getFullYear();
  const sm = start.getMonth();
  const sd = start.getDate();

  const ey = end.getFullYear();
  const em = end.getMonth();
  const ed = end.getDate();

  const isSameDay = toIso(start) === toIso(end);

  if (locale === 'en') {
    if (isSameDay) {
      return `${sd} ${EN_MONTHS_SHORT[sm]} ${sy}`;
    }
    if (sy === ey && sm === em) {
      return `${sd}-${ed} ${EN_MONTHS_SHORT[sm]} ${sy}`;
    }
    if (sy === ey) {
      return `${sd} ${EN_MONTHS_SHORT[sm]} - ${ed} ${EN_MONTHS_SHORT[em]} ${sy}`;
    }
    return `${sd} ${EN_MONTHS_SHORT[sm]} ${sy} - ${ed} ${EN_MONTHS_SHORT[em]} ${ey}`;
  }

  if (locale === 'zh') {
    if (isSameDay) {
      return `${sy}年${sm + 1}月${sd}日`;
    }
    if (sy === ey && sm === em) {
      return `${sy}年${sm + 1}月${sd}-${ed}日`;
    }
    return `${sy}年${sm + 1}月${sd}日 - ${em + 1}月${ed}日`;
  }

  // Thai Default (Buddhist Era)
  const thaiBuddhistYear = sy + 543;
  if (isSameDay) {
    return `${sd} ${THAI_MONTHS_SHORT[sm]} ${thaiBuddhistYear}`;
  }
  if (sy === ey && sm === em) {
    return `${sd}-${ed} ${THAI_MONTHS_SHORT[sm]} ${thaiBuddhistYear}`;
  }
  if (sy === ey) {
    return `${sd} ${THAI_MONTHS_SHORT[sm]} - ${ed} ${THAI_MONTHS_SHORT[em]} ${thaiBuddhistYear}`;
  }
  return `${sd} ${THAI_MONTHS_SHORT[sm]} ${thaiBuddhistYear} - ${ed} ${THAI_MONTHS_SHORT[em]} ${ey + 543}`;
}

export const TravelDatePicker: React.FC<TravelDatePickerProps> = ({
  id = 'travel-date-picker',
  value,
  onChange,
  days = 1,
  onDaysChange,
  placeholder,
  required = false,
  className = '',
  mode = 'range',
}) => {
  const { locale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const todayIso = useMemo(() => toIso(today), [today]);

  // Selected date range state in ISO string format
  const [selectedStartIso, setSelectedStartIso] = useState<string>('');
  const [selectedEndIso, setSelectedEndIso] = useState<string>('');

  // Calendar view navigation (Year & Month)
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // Available selectable years: current year + 3 upcoming years
  const availableYears = useMemo(() => {
    const startYear = today.getFullYear();
    return [startYear, startYear + 1, startYear + 2, startYear + 3];
  }, [today]);

  // Number of days numeric
  const numericDays = Math.max(1, Number(days) || 1);

  // Synchronize internal date selection when value is cleared or changed externally
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    if (!value) {
      setSelectedStartIso('');
      setSelectedEndIso('');
    }
  }

  // Click outside to collapse calendar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const commitRange = (startIso: string, endIso: string) => {
    setSelectedStartIso(startIso);
    setSelectedEndIso(endIso);
    const startDate = parseIso(startIso);
    const endDate = parseIso(endIso);
    onChange(formatTravelRange(startDate, endDate, locale));
    const dayCount =
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (onDaysChange) onDaysChange(Math.max(1, dayCount));
  };

  // Day selection logic - standard calendar UX:
  // 1) empty or finished selection → first click = one day
  // 2) one day selected → later click extends range; earlier click starts over
  // 3) range selected → move start/end; click inside does nothing
  const handleSelectDay = (dayIso: string) => {
    if (dayIso < todayIso) return;

    if (mode === 'single') {
      commitRange(dayIso, dayIso);
      return;
    }

    // No selection, or a complete range already picked → start a fresh single day
    if (!selectedStartIso || !selectedEndIso || selectedStartIso !== selectedEndIso) {
      commitRange(dayIso, dayIso);
      return;
    }

    // Only start day selected (single day)
    if (dayIso === selectedStartIso) return;
    if (dayIso > selectedStartIso) {
      commitRange(selectedStartIso, dayIso);
      return;
    }
    commitRange(dayIso, dayIso);
  };

  // Quick preset helpers
  const applyQuickPreset = (offsetDays: number, totalDays: number = 1) => {
    const s = new Date(today);
    s.setDate(s.getDate() + offsetDays);
    const sIso = toIso(s);

    const e = new Date(s);
    e.setDate(e.getDate() + (Math.max(1, totalDays) - 1));
    const eIso = toIso(e);

    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
    commitRange(sIso, eIso);
  };

  const handleQuickToday = () => applyQuickPreset(0, mode === 'single' ? 1 : numericDays);
  const handleQuickTomorrow = () => applyQuickPreset(1, mode === 'single' ? 1 : numericDays);
  const handleQuickThisWeekend = () => {
    const currentDay = today.getDay();
    let daysUntilSat = 6 - currentDay;
    if (daysUntilSat < 0) daysUntilSat = 6;
    if (mode === 'single') {
      applyQuickPreset(daysUntilSat, 1);
      return;
    }
    applyQuickPreset(daysUntilSat, 2);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedStartIso('');
    setSelectedEndIso('');
    onChange('');
    if (onDaysChange) onDaysChange(1);
  };

  // Days of month matrix calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthNames = locale === 'en' ? EN_MONTHS_FULL : locale === 'zh' ? ZH_MONTHS : THAI_MONTHS_FULL;
  const dayHeaders = locale === 'en' ? DAY_HEADERS_EN : locale === 'zh' ? DAY_HEADERS_ZH : DAY_HEADERS_TH;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Trigger Bar */}
      <div
        className={`w-full min-h-[44px] h-11 px-3 bg-white dark:bg-slate-850 dark:text-white rounded-none text-body-base font-body-base border transition-all flex items-center justify-between cursor-pointer select-none ${
          isOpen
            ? 'border-slate-900 dark:border-white bg-white dark:bg-slate-900 shadow-sm'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
          <CalendarIcon className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
          {value ? (
            <span className="font-bold text-navy-deep dark:text-white truncate text-xs sm:text-sm">
              {value}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate text-xs sm:text-sm">
              {placeholder || t('tdp.placeholder')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-none text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('tdp.clearDate')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="p-1 text-slate-500 dark:text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {/* Hidden input to satisfy standard HTML form validation if required */}
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Interactive Expandable Calendar Panel */}
      {isOpen && (
        <div className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl p-3 sm:p-4 z-50 animate-fade-in space-y-3">
          {/* Header Bar: Month & Year Selectors + Nav buttons */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
            {/* Quick Month & Year Dropdowns */}
            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="h-8 px-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-none text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer focus:outline-none focus:border-slate-900"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Select (Buddhist Era for TH) */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="h-8 px-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-none text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer focus:outline-none focus:border-slate-900"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {locale === 'th' ? `${yr + 543} (${yr})` : yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Month Arrow Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-none border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors"
                title={t('tdp.prevMonth')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-none border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors"
                title={t('tdp.nextMonth')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Date Presets Bar */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <span>{t('tdp.quick')}</span>
            </span>
            <button
              type="button"
              onClick={handleQuickToday}
              className="px-2.5 py-1 rounded-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('tdp.today')}
            </button>
            <button
              type="button"
              onClick={handleQuickTomorrow}
              className="px-2.5 py-1 rounded-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('tdp.tomorrow')}
            </button>
            <button
              type="button"
              onClick={handleQuickThisWeekend}
              className="px-2.5 py-1 rounded-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-amber-700 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('tdp.weekend')}
            </button>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {dayHeaders.map((dh, i) => (
              <div key={dh} className={i === 0 ? 'text-rose-500 font-bold' : ''}>
                {dh}
              </div>
            ))}
          </div>

          {/* Days Grid Matrix */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Offset before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 sm:h-10" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(viewYear, viewMonth, dayNum);
              const iso = toIso(dateObj);
              const isPast = iso < todayIso;
              const isToday = iso === todayIso;

              const isStart = iso === selectedStartIso;
              const isEnd = iso === selectedEndIso;
              const isInRange =
                mode === 'range' &&
                selectedStartIso &&
                selectedEndIso &&
                iso > selectedStartIso &&
                iso < selectedEndIso;
              const isSelected = isStart || isEnd;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDay(iso)}
                  className={`h-9 sm:h-10 text-xs sm:text-sm font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-none ${
                    isPast
                      ? 'opacity-25 bg-transparent cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm z-10 font-black'
                      : isInRange
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : isToday
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white font-black'
                      : 'bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-none bg-slate-900 dark:bg-white absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Manual text edit toggle */}
          {isManualMode ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
                {t('tdp.manualLabel')}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('tdp.manualPh')}
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-none text-xs focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>
          ) : null}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsManualMode(!isManualMode)}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isManualMode ? t('tdp.manualHide') : t('tdp.manualShow')}</span>
            </button>

            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded-none border border-rose-300 dark:border-rose-900 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('tdp.clearValue')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('tdp.done')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
