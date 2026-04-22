import { describe, expect, it } from 'vitest';

import {
  MaterialFactory,
  createMaterialForEntity,
  listRegisteredShaders,
} from '@/engine/MaterialFactory';

import {
  ENT_COVERAGE_FIXTURE,
  assertUniqueEntIds,
  countByStatus,
  type EntCoverageRow,
} from './entCoverage';

/**
 * T-V-02 — Per-family MaterialFactory coverage test. Iterates every Tier A
 * ENT-ID from Doc 17 and asserts the factory can build a material when the
 * shader is registered. Rows with `shader=null` (inline-rendered, pre-T-V-29)
 * are recorded but not asserted — they become assertions once externalised.
 *
 * When a new shader is wired into MaterialFactory.SHADER_REGISTRY, flip the
 * matching fixture row to `status: 'shipped'`; the `assertable` counter
 * increments and this test tightens automatically.
 */

const REGISTERED = new Set(listRegisteredShaders());

describe('MaterialFactory coverage — Tier A fixture', () => {
  it('has no duplicate ENT-IDs', () => {
    expect(() => assertUniqueEntIds()).not.toThrow();
  });

  it('covers all 154 Tier A subtypes', () => {
    expect(ENT_COVERAGE_FIXTURE.length).toBe(154);
  });

  it('tracks a sensible status distribution at V0 entry', () => {
    const counts = countByStatus();
    // Rough bounds matching Doc 17 §0.1 summary. Exact counts drift as
    // rows flip; this test just guards against accidental mass-regress.
    expect(counts.shipped).toBeGreaterThanOrEqual(45);
    expect(counts.shipped + counts['in-progress'] + counts.planned + counts.inline).toBe(154);
    // Every inline row must document why it isn't factory-routed.
    for (const row of ENT_COVERAGE_FIXTURE) {
      if (row.status === 'inline') {
        expect(row.note, `${row.id} inline row must have note`).toBeTruthy();
      }
    }
  });

  describe.each(ENT_COVERAGE_FIXTURE as EntCoverageRow[])(
    '$id $subtype',
    ({ id, shader, status, note }) => {
      if (shader === null) {
        it.skip(`inline-rendered, excluded until externalised${note ? ` (${note})` : ''}`, () => {});
        return;
      }

      const registered = REGISTERED.has(shader);

      if (!registered) {
        it.skip(`shader '${shader}' not in registry yet${note ? ` (${note})` : ''}`, () => {});
        return;
      }

      it(`MaterialFactory.create builds '${shader}'`, () => {
        const { material, shaderKey } = createMaterialForEntity({
          kind: undefined,
          render: { shader },
        });
        expect(shaderKey).toBe(shader);
        expect(material.name).toBe(shader);
      });

      if (status === 'shipped' || status === 'in-progress') {
        it(`material.name matches expected shader key '${shader}'`, () => {
          const { material } = createMaterialForEntity({
            render: { shader, defines: { TEST_DEFINE: 1 } },
          });
          expect(material.name).toBe(shader);
          expect(material.defines.TEST_DEFINE).toBe('1');
        });
      }
    },
  );
});

describe('MaterialFactory.listRegisteredShaders', () => {
  it('exposes every shader referenced by Tier A shipped rows', () => {
    const shippedShaders = new Set<string>();
    for (const row of ENT_COVERAGE_FIXTURE) {
      if (row.status === 'shipped' && row.shader) shippedShaders.add(row.shader);
    }
    const registered = new Set(MaterialFactory.listRegisteredShaders());
    const missing = [...shippedShaders].filter((s) => !registered.has(s));
    expect(missing).toEqual([]);
  });
});
