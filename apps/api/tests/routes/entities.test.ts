import { describe, expect, it } from 'vitest';

import { ENT_ID_PATTERN, rowToEntity } from '../../src/schemas/entity.js';

describe('ent_id pattern', () => {
  it('accepts canonical ids', () => {
    expect(ENT_ID_PATTERN.test('GAL-m31')).toBe(true);
    expect(ENT_ID_PATTERN.test('ENT-7011')).toBe(true);
    expect(ENT_ID_PATTERN.test('NAIF-399')).toBe(true);
    expect(ENT_ID_PATTERN.test('STAR-Sirius')).toBe(true);
  });

  it('rejects SQL-injection shapes', () => {
    expect(ENT_ID_PATTERN.test("GAL-m31'; DROP TABLE entities;--")).toBe(false);
    expect(ENT_ID_PATTERN.test('GAL m31')).toBe(false);
    expect(ENT_ID_PATTERN.test('../../etc/passwd')).toBe(false);
    expect(ENT_ID_PATTERN.test('%20OR%201=1')).toBe(false);
  });

  it('rejects too-short or too-long ids', () => {
    expect(ENT_ID_PATTERN.test('A')).toBe(false);
    expect(ENT_ID_PATTERN.test('a'.repeat(65))).toBe(false);
  });
});

describe('rowToEntity', () => {
  it('builds a self link from ent_id', () => {
    const entity = rowToEntity({
      ent_id: 'GAL-m31',
      name: 'Andromeda Galaxy',
      kind: '1',
      category: '8',
      ra_deg: 10.6847,
      dec_deg: 41.2688,
      distance_pc: 778_000,
      magnitude: 3.44,
      metadata: { size_arcmin: 190 },
    });
    expect(entity._links.self).toBe('/v1/entities/ent/GAL-m31');
    expect(entity.name).toBe('Andromeda Galaxy');
    expect(entity.magnitude).toBe(3.44);
  });

  it('passes through nullable fields', () => {
    const entity = rowToEntity({
      ent_id: 'GAL-anon',
      name: 'Anon',
      kind: '1',
      category: '8',
      ra_deg: null,
      dec_deg: null,
      distance_pc: null,
      magnitude: null,
      metadata: null,
    });
    expect(entity.ra_deg).toBeNull();
    expect(entity.magnitude).toBeNull();
    expect(entity.metadata).toBeNull();
  });
});
