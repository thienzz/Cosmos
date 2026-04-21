import { describe, expect, it } from 'vitest';

import {
  formatJulianDateCompact,
  formatJulianDateGregorian,
  formatSpeedLabel,
  SPEED_SLIDER_MAX_LOG10,
  sliderToSpeed,
  speedToSlider,
  TIME_STEP_PRESETS,
} from '../timeFormat';

describe('formatJulianDateGregorian', () => {
  it('formats J2000 as 2000-01-01 12:00:00', () => {
    expect(formatJulianDateGregorian(2_451_545.0)).toBe('2000-01-01 12:00:00');
  });

  it('formats 2026-04-19 00:00 UTC correctly', () => {
    // JD for 2026-04-19 00:00 UTC = 2,461,149.5
    expect(formatJulianDateGregorian(2_461_149.5)).toBe('2026-04-19 00:00:00');
  });

  it('tags BCE years with "BCE" suffix', () => {
    // JD 1_721_057.5 = 1 BCE Jan 1 00:00 (astronomical year 0)
    const out = formatJulianDateGregorian(1_721_057.5);
    expect(out).toMatch(/ BCE$/);
    expect(out).toContain('0001-');
  });

  it('returns a placeholder for non-finite input', () => {
    expect(formatJulianDateGregorian(Number.NaN)).toBe('—');
    expect(formatJulianDateGregorian(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatJulianDateCompact', () => {
  it('formats J2000 as "01 JAN 2000"', () => {
    expect(formatJulianDateCompact(2_451_545.0)).toBe('01 JAN 2000');
  });
});

describe('speed ↔ slider mapping', () => {
  it('slider 0 → 1× (real-time)', () => {
    expect(sliderToSpeed(0)).toBeCloseTo(1, 6);
  });

  it('slider 1 → 10^SPEED_SLIDER_MAX_LOG10', () => {
    expect(sliderToSpeed(1)).toBeCloseTo(Math.pow(10, SPEED_SLIDER_MAX_LOG10), 3);
  });

  it('speedToSlider is the inverse of sliderToSpeed', () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const speed = sliderToSpeed(v);
      expect(speedToSlider(speed)).toBeCloseTo(v, 5);
    }
  });

  it('speedToSlider drops sign (magnitude only)', () => {
    expect(speedToSlider(1000)).toBe(speedToSlider(-1000));
  });

  it('speedToSlider clamps out-of-range inputs to [0, 1]', () => {
    expect(speedToSlider(0.0001)).toBe(0);
    expect(speedToSlider(1e20)).toBe(1);
    expect(speedToSlider(0)).toBe(0);
  });
});

describe('formatSpeedLabel', () => {
  it('tags real-time at 1×', () => {
    expect(formatSpeedLabel(1)).toBe('REAL-TIME');
  });

  it('reports PAUSED at 0', () => {
    expect(formatSpeedLabel(0)).toBe('PAUSED');
  });

  it('uses minute/hour/day/month/year units as the magnitude grows', () => {
    expect(formatSpeedLabel(60)).toContain('min/s');
    expect(formatSpeedLabel(3_600)).toContain('hr/s');
    expect(formatSpeedLabel(86_400)).toContain('d/s');
    // 31.5 days — crosses the month boundary (31_557_600 / 12 ≈ 2_629_800).
    expect(formatSpeedLabel(2_700_000)).toContain('mo/s');
    expect(formatSpeedLabel(31_557_600)).toContain('yr/s');
  });

  it('prefixes negatives with a minus', () => {
    expect(formatSpeedLabel(-86_400)).toMatch(/^-.*d\/s$/);
  });

  it('returns "—" for non-finite input', () => {
    expect(formatSpeedLabel(Number.NaN)).toBe('—');
  });
});

describe('TIME_STEP_PRESETS', () => {
  it('provides the Doc 21 presets (hr/day/mo/yr/10yr)', () => {
    const labels = TIME_STEP_PRESETS.map((p) => p.label);
    expect(labels).toContain('+1hr');
    expect(labels).toContain('+1day');
    expect(labels).toContain('+1mo');
    expect(labels).toContain('+1yr');
    expect(labels).toContain('+10yr');
  });

  it('deltaDays are monotonically increasing', () => {
    const deltas = TIME_STEP_PRESETS.map((p) => p.deltaDays);
    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeGreaterThan(deltas[i - 1] ?? 0);
    }
  });
});
