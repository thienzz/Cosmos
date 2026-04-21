import { describe, expect, it } from 'vitest';

import { computeBoostedScore, type TextSearchItem } from '../search';

/**
 * T51 — verify the client-side popularity boost in `computeBoostedScore`.
 *
 * Task requirement (from TASKS.md §T51 "Search ranking"):
 *   "Sirius" query → rank-1 must be α CMa (the star), not a homonym.
 *
 * We cover it with a concrete scenario: two hits share the same server
 * `_score`, one is a bright Hipparcos-catalogued star (the real Sirius),
 * the other a dim homonym. The boost should sort Sirius first.
 */

function makeItem(overrides: Partial<TextSearchItem>): TextSearchItem {
  return {
    id: 1,
    ent_id: 'ENT-0000',
    name: 'Placeholder',
    category: 1,
    category_name: 'Stars',
    type_name: 'Star',
    _score: 50,
    _links: { self: '/v1/entities/1' },
    ...overrides,
  };
}

describe('computeBoostedScore', () => {
  it('falls back to baseline 50 when server score is missing', () => {
    const item = makeItem({ _score: undefined });
    expect(computeBoostedScore(item)).toBeGreaterThanOrEqual(50);
  });

  it('boosts Messier objects by +20', () => {
    const plain = makeItem({ _score: 50, category: 5 });
    const messier = makeItem({
      _score: 50,
      category: 5,
      catalog_ids: { messier: 31 },
    });
    expect(computeBoostedScore(messier) - computeBoostedScore(plain)).toBe(20);
  });

  it('boosts IAU-named stars (HD or HIP present) by +15', () => {
    const plainStar = makeItem({ _score: 50, category: 1 });
    const namedStar = makeItem({
      _score: 50,
      category: 1,
      catalog_ids: { hipparcos: 32349 },
    });
    expect(computeBoostedScore(namedStar) - computeBoostedScore(plainStar)).toBe(15);
  });

  it('brightness boost favours brighter (lower-magnitude) objects', () => {
    const bright = makeItem({ _score: 50, magnitude_apparent: -1.46 });
    const dim = makeItem({ _score: 50, magnitude_apparent: 9.0 });
    expect(computeBoostedScore(bright)).toBeGreaterThan(computeBoostedScore(dim));
  });

  it('brightness floor clamps magnitude >= 10 to no boost', () => {
    const faint = makeItem({ _score: 50, magnitude_apparent: 12.0 });
    const plain = makeItem({ _score: 50 });
    expect(computeBoostedScore(faint)).toBe(computeBoostedScore(plain));
  });

  it('Sirius beats a faint homonym on equal server score (TS-SEARCH-004)', () => {
    const sirius = makeItem({
      id: 5072708048,
      ent_id: 'ENT-1001',
      name: 'Sirius',
      category: 1,
      magnitude_apparent: -1.46,
      catalog_ids: { hd: 48915, hipparcos: 32349 },
      _score: 50,
    });
    const homonym = makeItem({
      id: 999,
      ent_id: 'ENT-0000',
      name: 'Sirius (homonym)',
      category: 1,
      magnitude_apparent: 9.5,
      catalog_ids: {},
      _score: 50,
    });
    expect(computeBoostedScore(sirius)).toBeGreaterThan(computeBoostedScore(homonym));
  });

  it('Messier 31 wins over a non-Messier homonym on equal score', () => {
    const andromeda = makeItem({
      name: 'Andromeda Galaxy',
      category: 6,
      magnitude_apparent: 3.44,
      catalog_ids: { messier: 31, ngc: 224 },
      _score: 50,
    });
    const homonym = makeItem({
      name: 'Andromeda (other)',
      category: 6,
      magnitude_apparent: 12,
      _score: 50,
    });
    expect(computeBoostedScore(andromeda)).toBeGreaterThan(
      computeBoostedScore(homonym),
    );
  });
});
