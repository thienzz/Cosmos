import { describe, expect, it } from 'vitest';

import { formatPrefix, parseSearchPrefix } from '../searchPrefix';

/**
 * T51 — verify the catalog-prefix parser recognises every format the task
 * verify script exercises (HD 48915, Messier 31, NGC 224, HIP 32349, Gaia
 * DR3 5072708…) while declining obvious non-matches (α CMa, Dog Star,
 * Kepler-452 b).
 */

describe('parseSearchPrefix', () => {
  it('parses Messier with and without whitespace', () => {
    expect(parseSearchPrefix('Messier 31')).toEqual({ catalog: 'messier', id: 'M31' });
    expect(parseSearchPrefix('M 31')).toEqual({ catalog: 'messier', id: 'M31' });
    expect(parseSearchPrefix('M31')).toEqual({ catalog: 'messier', id: 'M31' });
    expect(parseSearchPrefix('m42')).toEqual({ catalog: 'messier', id: 'M42' });
  });

  it('parses NGC + IC numeric prefixes', () => {
    expect(parseSearchPrefix('NGC 224')).toEqual({ catalog: 'ngc', id: 'NGC224' });
    expect(parseSearchPrefix('ngc1976')).toEqual({ catalog: 'ngc', id: 'NGC1976' });
    expect(parseSearchPrefix('IC 10')).toEqual({ catalog: 'ic', id: 'IC10' });
    expect(parseSearchPrefix('ic1805')).toEqual({ catalog: 'ic', id: 'IC1805' });
  });

  it('parses Caldwell numeric prefixes but rejects bare "C"', () => {
    expect(parseSearchPrefix('Caldwell 14')).toEqual({ catalog: 'caldwell', id: 'C14' });
    expect(parseSearchPrefix('C 14')).toEqual({ catalog: 'caldwell', id: 'C14' });
    expect(parseSearchPrefix('C')).toBeNull();
  });

  it('parses HD / HIP / SAO bright-star ledgers', () => {
    expect(parseSearchPrefix('HD 48915')).toEqual({ catalog: 'hd', id: '48915' });
    expect(parseSearchPrefix('hd48915')).toEqual({ catalog: 'hd', id: '48915' });
    expect(parseSearchPrefix('HIP 32349')).toEqual({ catalog: 'hip', id: '32349' });
    expect(parseSearchPrefix('Hipparcos 32349')).toEqual({
      catalog: 'hip',
      id: '32349',
    });
    expect(parseSearchPrefix('SAO 151881')).toEqual({ catalog: 'sao', id: '151881' });
  });

  it('parses Gaia DR3 / DR2 19-digit IDs', () => {
    expect(parseSearchPrefix('Gaia DR3 5072708048013507072')).toEqual({
      catalog: 'gaia',
      id: '5072708048013507072',
    });
    expect(parseSearchPrefix('gaia 5072708048013507072')).toEqual({
      catalog: 'gaia',
      id: '5072708048013507072',
    });
    expect(parseSearchPrefix('Gaia DR2 123456789')).toEqual({
      catalog: 'gaia',
      id: '123456789',
    });
  });

  it('parses Tycho-2 hyphenated IDs', () => {
    expect(parseSearchPrefix('TYC 5949-2777-1')).toEqual({
      catalog: 'tycho2',
      id: 'TYC 5949-2777-1',
    });
    expect(parseSearchPrefix('Tycho 5949-2777-1')).toEqual({
      catalog: 'tycho2',
      id: 'TYC 5949-2777-1',
    });
  });

  it('strips leading zeros from Messier + Caldwell + NGC numbers', () => {
    expect(parseSearchPrefix('M 031')).toEqual({ catalog: 'messier', id: 'M31' });
    expect(parseSearchPrefix('NGC 0224')).toEqual({ catalog: 'ngc', id: 'NGC224' });
  });

  it('returns null for queries that are obvious names, not catalog prefixes', () => {
    expect(parseSearchPrefix('α CMa')).toBeNull();
    expect(parseSearchPrefix('Dog Star')).toBeNull();
    expect(parseSearchPrefix('Sirius')).toBeNull();
    expect(parseSearchPrefix('Kepler-452 b')).toBeNull();
    expect(parseSearchPrefix('Andromeda')).toBeNull();
    // Bare catalog letters with no ID are too ambiguous to route.
    expect(parseSearchPrefix('M')).toBeNull();
    expect(parseSearchPrefix('NGC')).toBeNull();
    expect(parseSearchPrefix('HD')).toBeNull();
  });

  it('ignores leading / trailing whitespace', () => {
    expect(parseSearchPrefix('   HD 48915   ')).toEqual({
      catalog: 'hd',
      id: '48915',
    });
  });

  it('returns null for empty or non-string input', () => {
    expect(parseSearchPrefix('')).toBeNull();
    expect(parseSearchPrefix('   ')).toBeNull();
    expect(parseSearchPrefix(null as unknown as string)).toBeNull();
    expect(parseSearchPrefix(undefined as unknown as string)).toBeNull();
  });
});

describe('formatPrefix', () => {
  it('renders a human-readable catalog hint', () => {
    expect(formatPrefix({ catalog: 'hd', id: '48915' })).toBe('HD: 48915');
    expect(formatPrefix({ catalog: 'messier', id: 'M31' })).toBe('MESSIER: M31');
    expect(formatPrefix({ catalog: 'gaia', id: '5072708048013507072' })).toBe(
      'GAIA: 5072708048013507072',
    );
  });
});
