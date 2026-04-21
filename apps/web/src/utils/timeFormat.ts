/**
 * Presentation helpers for the T17 time-controls UI.
 *
 * Two concerns:
 *   1. Format a Julian Date as a human-readable calendar string.
 *   2. Map the log-scaled speed slider (Doc 21 Screen 1.9 — 1× → 1,000,000×
 *      with logarithmic steps) to/from the raw `playbackSpeed` value the
 *      TimeEngine consumes (sim-seconds per real-second).
 *
 * Keeping these functions pure and free of React imports means we can
 * unit-test them without a DOM and reuse them in any future time-aware UI
 * (tour keyframe editor, time-update WS payload formatting, etc.).
 */

import { formatEra, julianDateToCalendar } from './julianDate';

// ---------------------------------------------------------------------------
// Julian Date → human-readable strings
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format the integer parts to `2026-04-19 14:32:00` (UTC, no timezone). */
export function formatJulianDateGregorian(jd: number): string {
  if (!Number.isFinite(jd)) return '—';
  const cal = julianDateToCalendar(jd);
  const { era, year: displayYear } = formatEra(cal.year);
  const yearStr = String(displayYear).padStart(4, '0');
  const month = String(cal.month).padStart(2, '0');
  const day = String(cal.day).padStart(2, '0');
  const hour = String(cal.hour).padStart(2, '0');
  const minute = String(cal.minute).padStart(2, '0');
  const second = String(Math.floor(cal.second)).padStart(2, '0');
  const suffix = era === 'BCE' ? ' BCE' : '';
  return `${yearStr}-${month}-${day} ${hour}:${minute}:${second}${suffix}`;
}

/** Compact form for tight UI zones: `19 APR 2026`. */
export function formatJulianDateCompact(jd: number): string {
  if (!Number.isFinite(jd)) return '—';
  const cal = julianDateToCalendar(jd);
  const { era, year: displayYear } = formatEra(cal.year);
  const day = String(cal.day).padStart(2, '0');
  const month = MONTHS[cal.month - 1]?.toUpperCase() ?? '???';
  const yearStr = String(displayYear);
  const suffix = era === 'BCE' ? ' BCE' : '';
  return `${day} ${month} ${yearStr}${suffix}`;
}

// ---------------------------------------------------------------------------
// Playback-speed ↔ slider mapping
// ---------------------------------------------------------------------------

/** Slider outputs 0..1; the UI then multiplies by the configured max-abs speed. */
export const SPEED_SLIDER_MAX_LOG10 = 9; // 10^9 sim-sec / real-sec
export const SPEED_SLIDER_MIN_LOG10 = 0; // 10^0 = real-time

/**
 * Map a linear slider value in `[0, 1]` to a log-scaled positive speed:
 *   0  → 1× (real-time)
 *   1  → 1e9× (galactic timescales)
 */
export function sliderToSpeed(linear: number): number {
  const clamped = Math.max(0, Math.min(1, linear));
  const exponent =
    SPEED_SLIDER_MIN_LOG10 +
    (SPEED_SLIDER_MAX_LOG10 - SPEED_SLIDER_MIN_LOG10) * clamped;
  return Math.pow(10, exponent);
}

/** Inverse of `sliderToSpeed`. Sign is dropped; caller handles reverse. */
export function speedToSlider(speed: number): number {
  const abs = Math.abs(speed);
  if (!Number.isFinite(abs) || abs <= 0) return 0;
  const exponent = Math.log10(abs);
  const norm =
    (exponent - SPEED_SLIDER_MIN_LOG10) /
    (SPEED_SLIDER_MAX_LOG10 - SPEED_SLIDER_MIN_LOG10);
  return Math.max(0, Math.min(1, norm));
}

// ---------------------------------------------------------------------------
// Speed label formatting
// ---------------------------------------------------------------------------

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_YEAR = 31_557_600; // Julian year (365.25 d)

/**
 * Format `playbackSpeed` (sim-seconds per real-second) as a human-readable
 * label. At realistic scales we prefer unit-per-real-second phrasing
 * because "1x" and "1,000,000x" don't communicate physical meaning to a
 * non-technical user.
 *
 *   1       → "REAL-TIME"
 *   60      → "1min/s"
 *   86_400  → "1day/s"
 *   2.628e6 → "1mo/s"
 *   3.156e7 → "1yr/s"
 *   3.156e9 → "100yr/s"
 *   …
 *
 * Negative values get a leading minus: "-1yr/s".
 */
export function formatSpeedLabel(speed: number): string {
  if (!Number.isFinite(speed)) return '—';
  if (speed === 0) return 'PAUSED';
  const abs = Math.abs(speed);
  const sign = speed < 0 ? '-' : '';

  if (abs < 1) return `${sign}${formatShortNumber(abs)}×`;
  if (abs === 1) return 'REAL-TIME';
  if (abs < SECONDS_PER_MINUTE) return `${sign}${formatShortNumber(abs)}×`;
  if (abs < SECONDS_PER_HOUR) {
    return `${sign}${formatShortNumber(abs / SECONDS_PER_MINUTE)}min/s`;
  }
  if (abs < SECONDS_PER_DAY) {
    return `${sign}${formatShortNumber(abs / SECONDS_PER_HOUR)}hr/s`;
  }
  if (abs < SECONDS_PER_YEAR / 12) {
    return `${sign}${formatShortNumber(abs / SECONDS_PER_DAY)}d/s`;
  }
  if (abs < SECONDS_PER_YEAR) {
    return `${sign}${formatShortNumber(abs / (SECONDS_PER_YEAR / 12))}mo/s`;
  }
  return `${sign}${formatShortNumber(abs / SECONDS_PER_YEAR)}yr/s`;
}

function formatShortNumber(n: number): string {
  if (n >= 1000) return `${Math.round(n).toLocaleString('en-US')}`;
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

// ---------------------------------------------------------------------------
// Preset step sizes (Doc 21 Screen 1.9 — "+1hr +1day +1mo +1yr +10yr")
// ---------------------------------------------------------------------------

export interface TimePreset {
  label: string;
  deltaDays: number;
}

export const TIME_STEP_PRESETS: readonly TimePreset[] = [
  { label: '+1hr', deltaDays: 1 / 24 },
  { label: '+1day', deltaDays: 1 },
  { label: '+1mo', deltaDays: 30 },
  { label: '+1yr', deltaDays: 365.25 },
  { label: '+10yr', deltaDays: 3652.5 },
];
