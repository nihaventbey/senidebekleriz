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

  return true;
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
