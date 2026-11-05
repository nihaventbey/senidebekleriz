/**
 * Helper utilities for Active Year and Quarter filtering in Content Discovery.
 * Divides the year into 4 quarters:
 * Q1: Jan 1 - Mar 31
 * Q2: Apr 1 - Jun 30
 * Q3: Jul 1 - Sep 30
 * Q4: Oct 1 - Dec 31
 */

export type QuarterInfo = {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  startDateStr: string; // "YYYY-MM-DD" e.g. "2026-10-01"
  endDateStr: string;   // "YYYY-MM-DD" e.g. "2026-12-31"
  startDateTime: Date;
  endDateTime: Date;
  quarterName: string;  // e.g. "Ekim - Aralık"
  label: string;        // e.g. "2026 4. Çeyrek (Ekim - Aralık)"
};

const QUARTER_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: "Ocak - Mart",
  2: "Nisan - Haziran",
  3: "Temmuz - Eylül",
  4: "Ekim - Aralık",
};

const TURKISH_MONTHS: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11,
};

export function getCurrentQuarterInfo(refDate = new Date()): QuarterInfo {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-11
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;

  const startMonthNum = (quarter - 1) * 3 + 1;
  const startMonthStr = String(startMonthNum).padStart(2, "0");
  const startDateStr = `${year}-${startMonthStr}-01`;
  const startDateTime = new Date(`${startDateStr}T00:00:00.000Z`);

  // Last day of quarter: day 0 of month (quarter * 3 + 1)
  const lastDayDate = new Date(Date.UTC(year, quarter * 3, 0));
  const endMonthStr = String(lastDayDate.getUTCMonth() + 1).padStart(2, "0");
  const endDayStr = String(lastDayDate.getUTCDate()).padStart(2, "0");
  const endDateStr = `${year}-${endMonthStr}-${endDayStr}`;
  const endDateTime = new Date(`${endDateStr}T23:59:59.999Z`);

  const quarterName = QUARTER_NAMES[quarter];
  const label = `${year} ${quarter}. Çeyrek (${quarterName})`;

  return {
    year,
    quarter,
    startDateStr,
    endDateStr,
    startDateTime,
    endDateTime,
    quarterName,
    label,
  };
}

/**
 * Checks if a title or snippet explicitly references a day and month that has already passed
 * relative to refDate (e.g. "17 Ekim'de başlıyor" when today is 5 Kasım).
 */
export function hasPastDateInText(text: string, refDate = new Date()): boolean {
  if (!text) return false;
  const currentYear = refDate.getFullYear();
  const todayStart = new Date(refDate);
  todayStart.setHours(0, 0, 0, 0);

  // Match Turkish patterns like: "17 Ekim", "17 Ekim'de", "17 Ekim 2026", "28 Kasım'a dek"
  const regex =
    /\b(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:'?(?:de|da|te|ta|ye|ya|e|a|den|dan|ten|tan|\s*(?:dek|kadar)))?(?:\s+(\d{4}))?\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const monthKey = match[2].toLowerCase();
    const explicitYear = match[3] ? parseInt(match[3], 10) : currentYear;
    const monthIndex = TURKISH_MONTHS[monthKey];

    if (monthIndex === undefined || day < 1 || day > 31) continue;

    // Check if whole text is "X'e dek / kadar" (an ongoing exhibition ending on date X)
    const isUntil = /(?:'?(?:e|a)\s*dek|kadar)\b/i.test(match[0]);
    const eventDate = new Date(explicitYear, monthIndex, day);
    eventDate.setHours(23, 59, 59, 999);

    // If it is in the past
    if (eventDate.getTime() < todayStart.getTime()) {
      // If it says "28 Kasım'a dek", that's future. But if it says "17 Ekim'de açılıyor" or "17 Ekim'e dek" and Oct 17 is past, it's past!
      return true;
    }
  }

  return false;
}

/**
 * Checks if a publication date is fresh (within maxDays from refDate, default 7 days).
 */
export function isDiscoveryDateFresh(
  dateStr?: string | null,
  refDate = new Date(),
  maxDays = 7
): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;

  const diffMs = refDate.getTime() - d.getTime();
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  // If pubDate is more than maxDays in the past
  if (diffMs > maxMs) {
    return false;
  }
  // Reject future hallucinated dates (> 2 days ahead)
  if (diffMs < -2 * 24 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}

/**
 * Checks if a publication date falls within the active year and current quarter.
 * Rejects dates from previous years or earlier quarters.
 */
export function isDateInActiveQuarter(dateStr?: string | null, refDate = new Date()): boolean {
  if (!dateStr) return true; // If no date is available, allow content to be judged by other rules
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;

  const q = getCurrentQuarterInfo(refDate);

  // Must be in active year
  if (d.getUTCFullYear() < q.year) {
    return false;
  }

  // Must be on or after quarter start date
  if (d < q.startDateTime) {
    return false;
  }

  // Also enforce strict freshness (e.g. within 10 days for active discovery)
  return isDiscoveryDateFresh(dateStr, refDate, 10);
}

/**
 * Checks if a title explicitly references a past year (e.g. 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025).
 */
export function hasPastYearInTitle(title: string, currentYear = new Date().getFullYear()): boolean {
  const match = title.match(/\b(201\d|202[0-5])\b/);
  if (!match) return false;
  const matchedYear = parseInt(match[1], 10);
  return matchedYear < currentYear && !title.includes(String(currentYear));
}
