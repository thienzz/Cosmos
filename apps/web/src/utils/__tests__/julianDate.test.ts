import { describe, expect, it } from 'vitest';

import {
  calendarToJulianDate,
  eraToAstronomicalYear,
  formatEra,
  formatIsoDate,
  julianDateToCalendar,
  parseIsoDate,
} from '../julianDate';

describe('JD ↔ calendar round-trip', () => {
  it('J2000.0 (JD 2451545.0) = 2000-01-01 12:00 TT', () => {
    const cal = julianDateToCalendar(2_451_545.0);
    expect(cal.year).toBe(2000);
    expect(cal.month).toBe(1);
    expect(cal.day).toBe(1);
    expect(cal.hour).toBe(12);
    expect(cal.minute).toBe(0);
    expect(Math.abs(cal.second)).toBeLessThan(1e-6);
  });

  it('calendarToJulianDate reproduces J2000.0', () => {
    expect(
      calendarToJulianDate({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }),
    ).toBeCloseTo(2_451_545.0, 9);
  });

  it('round-trips 20 diverse JDs to < 1 second', () => {
    const samples = [
      2_287_184.5, // 1550-01-01 (SPICE lower bound)
      2_451_545.0, // J2000
      2_460_000.0, // 2023-02-24
      2_688_976.5, // 2650-01-01 (SPICE upper bound)
      2_415_020.5, // 1900-01-01 Gregorian
      2_299_160.5, // 1582-10-15 cutover
      2_299_159.5, // 1582-10-04 (Julian calendar side)
      1_721_423.5, // 1 CE Jan 1
      1_721_057.5, // 1 BCE Jan 1 astronomical (year 0)
      1_720_692.5, // 2 BCE Jan 1 astronomical (year -1)
    ];
    for (const jd of samples) {
      const cal = julianDateToCalendar(jd);
      const back = calendarToJulianDate(cal);
      expect(Math.abs(back - jd)).toBeLessThan(1 / 86_400); // 1 second tolerance
    }
  });
});

describe('TS-TIME-005 — BCE / CE boundary', () => {
  it('year 0 (astronomical) = 1 BCE', () => {
    const era = formatEra(0);
    expect(era.era).toBe('BCE');
    expect(era.year).toBe(1);
  });

  it('year −1 (astronomical) = 2 BCE', () => {
    expect(formatEra(-1)).toEqual({ era: 'BCE', year: 2 });
  });

  it('year +1 = 1 CE', () => {
    expect(formatEra(1)).toEqual({ era: 'CE', year: 1 });
  });

  it('round-trips the era conversions', () => {
    for (const [era, year] of [
      ['CE', 2000],
      ['CE', 1],
      ['BCE', 1],
      ['BCE', 100],
      ['BCE', 4713],
    ] as const) {
      const astro = eraToAstronomicalYear(era, year);
      expect(formatEra(astro)).toEqual({ era, year });
    }
  });

  it('JD 1721057.5 is 1 BCE Jan 1 (year 0, month 1, day 1)', () => {
    const cal = julianDateToCalendar(1_721_057.5);
    expect(cal.year).toBe(0);
    expect(cal.month).toBe(1);
    expect(cal.day).toBe(1);
    expect(formatEra(cal.year)).toEqual({ era: 'BCE', year: 1 });
  });

  it('does not throw or return NaN for very negative years', () => {
    const cal = julianDateToCalendar(500_000); // deep BCE
    expect(Number.isFinite(cal.year)).toBe(true);
    expect(cal.year).toBeLessThan(0);
  });

  it('calendar → JD for a BCE year round-trips', () => {
    const jd = calendarToJulianDate({ year: -100, month: 6, day: 15, hour: 12 });
    const back = julianDateToCalendar(jd);
    expect(back.year).toBe(-100);
    expect(back.month).toBe(6);
    expect(back.day).toBe(15);
  });
});

describe('TS-TIME-004 — manual date input (ISO parsing)', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parseIsoDate('2024-03-15')).toEqual({
      year: 2024,
      month: 3,
      day: 15,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it('parses full ISO including time and Z suffix', () => {
    expect(parseIsoDate('2024-03-15T12:30:45Z')).toEqual({
      year: 2024,
      month: 3,
      day: 15,
      hour: 12,
      minute: 30,
      second: 45,
    });
  });

  it('parses BCE years via leading minus', () => {
    const cal = parseIsoDate('-0044-03-15');
    expect(cal.year).toBe(-44);
    expect(cal.month).toBe(3);
    expect(cal.day).toBe(15);
  });

  it('rejects malformed input', () => {
    expect(() => parseIsoDate('nope')).toThrow();
    expect(() => parseIsoDate('')).toThrow();
  });

  it('formatIsoDate round-trips parseIsoDate', () => {
    const cal = parseIsoDate('2024-03-15T01:02:03Z');
    expect(formatIsoDate(cal)).toBe('2024-03-15T01:02:03Z');
  });

  it('calendarToJulianDate accepts parsed ISO dates directly', () => {
    const cal = parseIsoDate('2000-01-01T12:00:00Z');
    expect(calendarToJulianDate(cal)).toBeCloseTo(2_451_545.0, 9);
  });

  it('throws on invalid month or day', () => {
    expect(() => calendarToJulianDate({ year: 2000, month: 13, day: 1 })).toThrow();
    expect(() => calendarToJulianDate({ year: 2000, month: 1, day: 32 })).toThrow();
  });
});
