'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  toISODateString,
  getUpcomingBusyRanges,
  isDateBusy,
} from '@/lib/availabilityUtils';
import { useLanguage } from '@/context/LanguageContext';

export interface CustomerAvailabilityScheduleProps {
  busyDates?: string[];
  isAvailable?: boolean;
  driverPhone?: string;
  driverNickname?: string;
  className?: string;
}

export const CustomerAvailabilitySchedule: React.FC<CustomerAvailabilityScheduleProps> = ({
  busyDates = [],
  isAvailable = true,
  className = '',
}) => {
  const { t, locale } = useLanguage();
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);

  const today = new Date();
  const todayIso = toISODateString(today);
  const isBusyToday = isDateBusy(todayIso, busyDates);
  const isCurrentlyAvailable = isAvailable && !isBusyToday;

  const upcomingRanges = getUpcomingBusyRanges(busyDates, locale);

  // Mini calendar state for current month
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dayHeadersTh = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const dayHeadersEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayHeadersZh = ['日', '一', '二', '三', '四', '五', '六'];
  const dayHeaders = locale === 'en' ? dayHeadersEn : locale === 'zh' ? dayHeadersZh : dayHeadersTh;

  return (
    <section className={`rounded-2xl border border-border-subtle dark:border-slate-700 bg-paper-canvas dark:bg-slate-800/60 p-space-md sm:p-space-lg space-y-space-sm text-left ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-title-card text-title-card text-navy-deep dark:text-white font-bold">
              {t('cal.scheduleTitle')}
            </h3>
            <span className="text-[11px] font-medium text-ink-muted dark:text-slate-400">
              {t('cal.scheduleSubtitle')}
            </span>
          </div>
        </div>

        {/* Current status pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            isCurrentlyAvailable
              ? 'bg-verified-emerald-soft text-verified-emerald'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCurrentlyAvailable ? 'bg-verified-emerald animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{isCurrentlyAvailable ? t('cal.statusFreeToday') : t('cal.statusBusyToday')}</span>
        </span>
      </div>

      {/* Booked dates summary or all-clear notice */}
      {upcomingRanges.length === 0 ? (
        <div className="p-3 rounded-xl bg-verified-emerald-soft/50 dark:bg-emerald-950/20 border border-verified-emerald/20 text-xs font-bold text-verified-emerald flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t('cal.customerAllDaysFree')}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-ink-muted dark:text-slate-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('cal.customerBusyWarning')}:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {upcomingRanges.map((range) => (
              <span
                key={`${range.startDate}-${range.endDate}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{range.label}</span>
                <span className="text-[10px] font-normal opacity-85">
                  ({range.count} {t('cal.unitDays')} - {t('cal.badgeBooked')})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Mini Month Calendar */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowCalendarPreview(!showCalendarPreview)}
          className="text-xs font-bold text-blue-action dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showCalendarPreview ? t('cal.hideCalendar') : t('cal.viewCalendar')}</span>
          {showCalendarPreview ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showCalendarPreview && (
          <div className="mt-3 p-3.5 rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 space-y-2 animate-fade-in">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-ink-muted">
              {dayHeaders.map((dh, i) => (
                <div key={dh} className={i === 0 || i === 6 ? 'text-rose-400' : ''}>
                  {dh}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`c-empty-${i}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(currentYear, currentMonth, dayNum);
                const iso = toISODateString(d);
                const isPast = iso < todayIso;
                const isToday = iso === todayIso;
                const isBusy = busyDates.includes(iso);

                return (
                  <div
                    key={iso}
                    title={isBusy ? t('cal.cellBusy') : isPast ? '' : t('cal.legendFree')}
                    className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center relative ${
                      isPast
                        ? 'opacity-25 text-ink-muted'
                        : isBusy
                        ? 'bg-rose-600 text-white font-extrabold shadow-2xs'
                        : isToday
                        ? 'border-2 border-blue-action bg-blue-50 dark:bg-blue-950 text-blue-action'
                        : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-200'
                    }`}
                  >
                    <span>{dayNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-paper-surface-muted border border-border-subtle" />
                <span>{t('cal.legendFree')}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-rose-600 font-bold">{t('cal.legendBusy')}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
