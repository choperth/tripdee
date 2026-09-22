/**
 * Date and Availability Utilities for TripDee
 * Supports ISO 'YYYY-MM-DD' dates, grouping contiguous dates into readable ranges,
 * and locale-aware formatting for Thai, English, and Chinese.
 */

export interface BusyDateRange {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  count: number;
  label: string;
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatSingleDate(iso: string, locale: string = 'th'): string {
  const [, m, d] = iso.split('-').map(Number);
  const monthIdx = m - 1;

  if (locale === 'en') {
    return `${EN_MONTHS_SHORT[monthIdx]} ${d}`;
  }
  if (locale === 'zh') {
    return `${m}月${d}日`;
  }
  // Thai default
  return `${d} ${THAI_MONTHS_SHORT[monthIdx]}`;
}

/**
 * Groups a list of 'YYYY-MM-DD' date strings into contiguous ranges and formats them.
 * e.g. ['2026-10-25', '2026-10-26', '2026-10-27'] -> "25–27 ต.ค."
 */
export function groupBusyDates(
  dates: string[] = [],
  locale: string = 'th'
): BusyDateRange[] {
  if (!dates || dates.length === 0) return [];

  // Filter valid dates, deduplicate and sort
  const sorted = Array.from(new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort();
  if (sorted.length === 0) return [];

  const ranges: BusyDateRange[] = [];
  let rangeStart = sorted[0];
  let prevDate = parseISODate(sorted[0]);
  let currentGroup: string[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currDate = parseISODate(current);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentGroup.push(current);
      prevDate = currDate;
    } else {
      // Range closed
      const rangeEnd = currentGroup[currentGroup.length - 1];
      ranges.push({
        startDate: rangeStart,
        endDate: rangeEnd,
        count: currentGroup.length,
        label: formatRangeLabel(rangeStart, rangeEnd, locale),
      });

      // Start new range
      rangeStart = current;
      prevDate = currDate;
      currentGroup = [current];
    }
  }

  // Push last group
  const rangeEnd = currentGroup[currentGroup.length - 1];
  ranges.push({
    startDate: rangeStart,
    endDate: rangeEnd,
    count: currentGroup.length,
    label: formatRangeLabel(rangeStart, rangeEnd, locale),
  });

  return ranges;
}

function formatRangeLabel(startIso: string, endIso: string, locale: string): string {
  const [, sm, sd] = startIso.split('-').map(Number);
  const [, em, ed] = endIso.split('-').map(Number);

  if (startIso === endIso) {
    return formatSingleDate(startIso, locale);
  }

  if (locale === 'en') {
    if (sm === em) {
      return `${EN_MONTHS_SHORT[sm - 1]} ${sd}–${ed}`;
    }
    return `${EN_MONTHS_SHORT[sm - 1]} ${sd} – ${EN_MONTHS_SHORT[em - 1]} ${ed}`;
  }

  if (locale === 'zh') {
    if (sm === em) {
      return `${sm}月${sd}日–${ed}日`;
    }
    return `${sm}月${sd}日–${em}月${ed}日`;
  }

  // Thai
  if (sm === em) {
    return `${sd}–${ed} ${THAI_MONTHS_SHORT[sm - 1]}`;
  }
  return `${sd} ${THAI_MONTHS_SHORT[sm - 1]} – ${ed} ${THAI_MONTHS_SHORT[em - 1]}`;
}

/**
 * Returns upcoming busy ranges (today or future dates only)
 */
export function getUpcomingBusyRanges(
  dates: string[] = [],
  locale: string = 'th'
): BusyDateRange[] {
  const todayIso = toISODateString(new Date());
  const futureDates = dates.filter((d) => d >= todayIso);
  return groupBusyDates(futureDates, locale);
}

/**
 * Checks if a specific date (or today) is in the busy list
 */
export function isDateBusy(date: Date | string, busyDates: string[] = []): boolean {
  const iso = typeof date === 'string' ? date : toISODateString(date);
  return busyDates.includes(iso);
}

/**
 * Generates an array of 'YYYY-MM-DD' strings between start and end inclusive
 */
export function generateDateRange(startIso: string, endIso: string): string[] {
  if (startIso > endIso) {
    [startIso, endIso] = [endIso, startIso];
  }
  const result: string[] = [];
  const curr = parseISODate(startIso);
  const end = parseISODate(endIso);

  while (curr <= end) {
    result.push(toISODateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return result;
}
