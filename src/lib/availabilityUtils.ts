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

const THAI_MONTHS_MAP: Record<string, number> = {
  'ม.ค.': 0, 'มกรา': 0, 'มกราคม': 0,
  'ก.พ.': 1, 'กุมภา': 1, 'กุมภาพันธ์': 1,
  'มี.ค.': 2, 'มีนา': 2, 'มีนาคม': 2,
  'เม.ย.': 3, 'เมษา': 3, 'เมษายน': 3,
  'พ.ค.': 4, 'พฤษภา': 4, 'พฤษภาพันธ์': 4, 'พฤษภาคม': 4,
  'มิ.ย.': 5, 'มิถุนา': 5, 'มิถุนายน': 5,
  'ก.ค.': 6, 'กรกฎา': 6, 'กรกฎาคม': 6,
  'ส.ค.': 7, 'สิงหา': 7, 'สิงหาคม': 7,
  'ก.ย.': 8, 'กันยา': 8, 'กันยายน': 8,
  'ต.ค.': 9, 'ตุลา': 9, 'ตุลาคม': 9,
  'พ.ย.': 10, 'พฤศจิกา': 10, 'พฤศจิกายน': 10,
  'ธ.ค.': 11, 'ธันวา': 11, 'ธันวาคม': 11,
};

const EN_MONTHS_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Returns current date string formatted as 'YYYY-MM-DD' in Asia/Bangkok time.
 */
export function getBangkokTodayIso(refDate: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(refDate);
  } catch {
    const y = refDate.getFullYear();
    const m = String(refDate.getMonth() + 1).padStart(2, '0');
    const d = String(refDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Parses free-form or formatted travel date string into an end Date object.
 * Supports:
 * - Thai formats: '20-21 ก.ย. 69', '22 ก.ย. 69', '3-5 ต.ค. 69', '2569'
 * - ISO formats: '2026-09-22'
 * - Chinese formats: '2026年9月20-21日'
 * - English formats: '20-21 Sep 2026', '22 Sep 2026'
 */
export function parseTravelEndDate(
  dateStr?: string,
  daysCount: number = 1,
  refDate: Date = new Date()
): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const validDays = Math.max(1, Number(daysCount) || 1);

  // 1. ISO format 'YYYY-MM-DD'
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const end = new Date(y, m, d + Math.max(0, validDays - 1));
    return end;
  }

  // 2. Chinese format: '2026年9月20-21日' or '9月22日'
  const zhMatch = trimmed.match(/(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?日?/);
  if (zhMatch) {
    const y = zhMatch[1] ? parseInt(zhMatch[1], 10) : refDate.getFullYear();
    const m = parseInt(zhMatch[2], 10) - 1;
    const startD = parseInt(zhMatch[3], 10);
    const endD = zhMatch[4] ? parseInt(zhMatch[4], 10) : (startD + Math.max(0, validDays - 1));
    return new Date(y, m, endD);
  }

  // 3. Thai / English text parser
  let month = -1;
  const sortedThaiMonths = Object.entries(THAI_MONTHS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [name, mIdx] of sortedThaiMonths) {
    if (trimmed.includes(name)) {
      month = mIdx;
      break;
    }
  }

  if (month === -1) {
    const lower = trimmed.toLowerCase();
    const sortedEnMonths = Object.entries(EN_MONTHS_MAP).sort((a, b) => b[0].length - a[0].length);
    for (const [name, mIdx] of sortedEnMonths) {
      const regex = new RegExp(`\\b${name}\\b`);
      if (regex.test(lower)) {
        month = mIdx;
        break;
      }
    }
  }

  if (month === -1) return null;

  // Extract year
  let year = refDate.getFullYear();
  // 4-digit BE (25xx)
  const be4Match = trimmed.match(/\b(25\d{2})\b/);
  if (be4Match) {
    year = parseInt(be4Match[1], 10) - 543;
  } else {
    // 4-digit AD (20xx)
    const ad4Match = trimmed.match(/\b(20\d{2})\b/);
    if (ad4Match) {
      year = parseInt(ad4Match[1], 10);
    } else {
      // 2-digit BE (e.g. 67, 68, 69, 70...)
      const be2Match = trimmed.match(/\b(6[5-9]|7[0-9]|8[0-9])\b/);
      if (be2Match) {
        year = 2500 + parseInt(be2Match[1], 10) - 543;
      }
    }
  }

  // Extract day or day range (e.g. 20-21 or 3-5 or 22)
  const rangeMatch = trimmed.match(/(\d{1,2})\s*[-–ถึงto]\s*(\d{1,2})/);
  if (rangeMatch) {
    const endD = parseInt(rangeMatch[2], 10);
    return new Date(year, month, endD);
  }

  const singleDayMatch = trimmed.match(/(\d{1,2})/);
  if (singleDayMatch) {
    const startD = parseInt(singleDayMatch[1], 10);
    const endD = startD + Math.max(0, validDays - 1);
    return new Date(year, month, endD);
  }

  return null;
}

/**
 * Checks if a travel date range has passed relative to Bangkok local time today.
 * If the travel end date < today, returns true.
 */
export function isTravelDatePassed(
  dateStr?: string,
  daysCount: number = 1,
  refDate: Date = new Date()
): boolean {
  if (!dateStr) return false;
  const endDate = parseTravelEndDate(dateStr, daysCount, refDate);
  if (!endDate || isNaN(endDate.getTime())) return false;

  const endIso = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  const todayIso = getBangkokTodayIso(refDate);

  return endIso < todayIso;
}

/**
 * Determines whether a board post is expired:
 * 1. Already marked isClosed / is_closed
 * 2. Travel date has passed (isTravelDatePassed)
 * 3. Fallback: created_at > 30 days old
 */
export function isBoardPostExpired(
  post: {
    date?: string;
    days?: number;
    created_at?: string;
    createdAt?: string;
    isClosed?: boolean;
    is_closed?: boolean;
  },
  refDate: Date = new Date()
): boolean {
  if (post.isClosed || post.is_closed) return true;
  if (post.date && isTravelDatePassed(post.date, post.days, refDate)) {
    return true;
  }
  const dateStr = post.created_at || post.createdAt;
  if (dateStr) {
    const created = new Date(dateStr);
    if (!isNaN(created.getTime())) {
      const daysDiff = (refDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) return true;
    }
  }
  return false;
}
