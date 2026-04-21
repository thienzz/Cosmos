/**
 * Julian Date ↔ calendar conversion (Meeus, *Astronomical Algorithms* §7).
 *
 * Uses astronomical year numbering everywhere:
 *   1 BCE = year 0, 2 BCE = year −1, …
 * The UI layer converts to the BCE/CE display form via `formatEra`.
 *
 * The algorithm auto-switches between the Julian (before 1582-10-15) and
 * Gregorian (from 1582-10-15) calendars so that JD 2451545.0 = J2000.0 is
 * preserved exactly. TS-TIME-005 exercises both branches.
 */

export interface CalendarDate {
  /** Astronomical year (1 BCE = 0, 2 BCE = −1). */
  year: number;
  /** 1-12. */
  month: number;
  /** 1-31. */
  day: number;
  /** 0-23. */
  hour: number;
  /** 0-59. */
  minute: number;
  /** Float so we can represent 12:00:30.5 etc. */
  second: number;
}

/** Era-friendly display form — `year` is always ≥ 1 with explicit era. */
export interface EraDate {
  year: number;
  month: number;
  day: number;
  era: 'BCE' | 'CE';
}

/** Cutoff JD between Julian and Gregorian calendars (1582-10-15 00:00 UTC). */
export const GREGORIAN_CUTOVER_JD = 2_299_160.5;

/**
 * Convert a Julian Date to a proleptic calendar date (Gregorian after
 * 1582-10-15, Julian before). Astronomical year numbering — the caller
 * uses `formatEra()` to present BCE/CE.
 */
export function julianDateToCalendar(jd: number): CalendarDate {
  if (!Number.isFinite(jd)) {
    throw new Error(`julianDateToCalendar: JD must be finite (got ${jd})`);
  }

  const jd05 = jd + 0.5;
  const Z = Math.floor(jd05);
  const F = jd05 - Z;

  let A: number;
  if (Z < GREGORIAN_CUTOVER_JD) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1_867_216.25) / 36_524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const dayFraction = B - D - Math.floor(30.6001 * E) + F;
  const day = Math.floor(dayFraction);

  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  // Convert fractional-day remainder back into h/m/s.
  const secondsOfDay = (dayFraction - day) * 86_400;
  const hour = Math.floor(secondsOfDay / 3600);
  const minute = Math.floor((secondsOfDay - hour * 3600) / 60);
  const second = secondsOfDay - hour * 3600 - minute * 60;

  return { year, month, day, hour, minute, second };
}

/**
 * Convert a calendar date to Julian Date. Supports astronomical year
 * numbering (year ≤ 0 for BCE). Auto-switches to the Julian calendar
 * for dates before 1582-10-15.
 */
export function calendarToJulianDate(date: Partial<CalendarDate>): number {
  const year = date.year ?? 2000;
  const month = date.month ?? 1;
  const day = date.day ?? 1;
  const hour = date.hour ?? 0;
  const minute = date.minute ?? 0;
  const second = date.second ?? 0;

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error('calendarToJulianDate: year/month/day must be finite');
  }
  if (month < 1 || month > 12) {
    throw new Error(`calendarToJulianDate: invalid month ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`calendarToJulianDate: invalid day ${day}`);
  }

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  // Provisional JD using the Gregorian branch; switch to Julian if the
  // resulting date predates the cutover.
  const dayFraction = day + (hour * 3600 + minute * 60 + second) / 86_400;

  const gregorianA = Math.floor(y / 100);
  const gregorianB = 2 - gregorianA + Math.floor(gregorianA / 4);
  const gregorianJD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    dayFraction +
    gregorianB -
    1524.5;

  if (gregorianJD >= GREGORIAN_CUTOVER_JD) return gregorianJD;

  // Julian calendar branch — B = 0.
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    dayFraction -
    1524.5
  );
}

/** Astronomical → BCE/CE display form. Year 0 → 1 BCE, year −1 → 2 BCE. */
export function formatEra(astronomicalYear: number): EraDate['era'] & never extends never
  ? { era: 'BCE' | 'CE'; year: number }
  : never;
export function formatEra(astronomicalYear: number): { era: 'BCE' | 'CE'; year: number } {
  if (astronomicalYear >= 1) return { era: 'CE', year: astronomicalYear };
  return { era: 'BCE', year: 1 - astronomicalYear };
}

/** Inverse of `formatEra`. */
export function eraToAstronomicalYear(era: 'BCE' | 'CE', year: number): number {
  return era === 'CE' ? year : 1 - year;
}

/** Parse an ISO-like string. Accepts both `YYYY-MM-DD` and `YYYY-MM-DDTHH:mm:ssZ`. */
export function parseIsoDate(input: string): CalendarDate {
  const match = /^(-?\d{1,6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?)?/.exec(
    input,
  );
  if (!match) throw new Error(`parseIsoDate: invalid input "${input}"`);
  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
    hour: hourStr ? Number(hourStr) : 0,
    minute: minuteStr ? Number(minuteStr) : 0,
    second: secondStr ? Number(secondStr) : 0,
  };
}

/** Format a CalendarDate as `±YYYY-MM-DDTHH:mm:ssZ`. */
export function formatIsoDate(date: CalendarDate): string {
  const pad = (n: number, w = 2): string => String(Math.floor(Math.abs(n))).padStart(w, '0');
  const sign = date.year < 0 ? '-' : '';
  const yearStr = pad(Math.abs(date.year), 4);
  const h = pad(date.hour);
  const m = pad(date.minute);
  const sInt = Math.floor(date.second);
  const s = pad(sInt);
  return `${sign}${yearStr}-${pad(date.month)}-${pad(date.day)}T${h}:${m}:${s}Z`;
}
