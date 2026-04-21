import { describe, expect, it } from 'vitest';

import {
  describedEntityCount,
  lookupDescription,
} from '../entityDescriptions';

/**
 * T51 — sanity-check the curated description seed. The full ~500-entry
 * table lands via CMS, so here we just verify: the lookup is
 * case-insensitive, falls through to the first non-null alias, and has
 * at least a meaningful baseline seeded.
 */

describe('entityDescriptions', () => {
  it('seeds more than a handful of entries', () => {
    expect(describedEntityCount()).toBeGreaterThanOrEqual(25);
  });

  it('looks up named stars by IAU name (case-insensitive)', () => {
    expect(lookupDescription('Sirius')?.summary).toMatch(/Brightest/i);
    expect(lookupDescription('sirius')?.summary).toMatch(/Brightest/i);
    expect(lookupDescription('VEGA')?.summary).toMatch(/A0V|Vega/i);
  });

  it('looks up Messier objects by both common name and number', () => {
    const m1 = lookupDescription('M1');
    const crab = lookupDescription('Messier 1');
    expect(m1).not.toBeNull();
    expect(crab).not.toBeNull();
    expect(m1?.summary).toMatch(/Crab/i);
    expect(crab?.summary).toMatch(/Crab/i);
  });

  it('falls through an alias list to the first hit', () => {
    // "Unknown name" fails, second alias "Andromeda" hits.
    const hit = lookupDescription('Unknown name', 'Andromeda');
    expect(hit?.summary).toMatch(/Andromeda/i);
  });

  it('returns null for unseeded entities', () => {
    expect(lookupDescription('Made-up Nebula')).toBeNull();
  });

  it('handles nullish keys gracefully', () => {
    expect(lookupDescription(null, undefined, '', 'Sirius')?.summary).toMatch(
      /Brightest/i,
    );
    expect(lookupDescription(null, undefined, '')).toBeNull();
  });
});
