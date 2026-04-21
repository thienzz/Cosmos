import { describe, expect, it, beforeEach } from 'vitest';

import {
  EntityRefRegistry,
  deserialise,
  entityRefRegistry,
  naifRef,
  nameRef,
  refsEqual,
  serialise,
} from '../entityRef.js';

beforeEach(() => {
  entityRefRegistry.clear();
});

describe('EntityRefRegistry', () => {
  it('assigns monotonic u32 surrogates starting at 1', () => {
    const a = entityRefRegistry.intern({ kind: 'gaia', id: '1234' });
    const b = entityRefRegistry.intern({ kind: 'gaia', id: '5678' });
    expect(a.surrogate).toBe(1);
    expect(b.surrogate).toBe(2);
  });

  it('interns duplicate catalog ids to the same surrogate', () => {
    const a = entityRefRegistry.intern({ kind: 'gaia', id: '1234' });
    const b = entityRefRegistry.intern({ kind: 'gaia', id: '1234' });
    expect(a).toBe(b);
  });

  it('normalises NGC/Messier formatting so aliases collapse', () => {
    const a = entityRefRegistry.intern({ kind: 'ngc', id: 'NGC 224' });
    const b = entityRefRegistry.intern({ kind: 'ngc', id: 'ngc0224' });
    const c = entityRefRegistry.intern({ kind: 'ngc', id: 'NGC  0224' });
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(a.id).toBe('NGC 224');
  });

  it('keeps Gaia DR3 source_ids as strings (overflow-safe)', () => {
    // Gaia DR3 3425614486485484160 — Betelgeuse — overflows Number exactness
    // but round-trips untouched through the registry.
    const a = entityRefRegistry.intern({
      kind: 'gaia',
      id: '3425614486485484160',
    });
    expect(a.id).toBe('3425614486485484160');
  });

  it('resolves refs by surrogate and by catalog id', () => {
    const ref = entityRefRegistry.intern({ kind: 'hipparcos', id: '32349' });
    expect(entityRefRegistry.bySurrogateId(ref.surrogate)).toBe(ref);
    expect(entityRefRegistry.byCatalogId('hipparcos', '32349')).toBe(ref);
  });

  it('segregates surrogate spaces across registries', () => {
    const local = new EntityRefRegistry();
    const a = local.intern({ kind: 'naif', id: '399' });
    const b = entityRefRegistry.intern({ kind: 'naif', id: '399' });
    expect(a.surrogate).toBe(b.surrogate); // both start at 1 — identical shape
    expect(a).not.toBe(b); // different registries → different frozen objects
  });
});

describe('naifRef / nameRef helpers', () => {
  it('wraps NAIF ids into a ref', () => {
    const earth = naifRef(399);
    expect(earth.kind).toBe('naif');
    expect(earth.id).toBe('399');
  });

  it('wraps star names without re-minting for alternate forms', () => {
    const a = nameRef('iau', 'Sirius');
    const b = nameRef('iau', 'Sirius');
    expect(a).toBe(b);
  });
});

describe('serialise / deserialise', () => {
  it('round-trips via the session registry with a stable surrogate', () => {
    const source = entityRefRegistry.intern({ kind: 'ngc', id: 'NGC 224' });
    const wire = serialise(source);
    const roundTripped = deserialise(wire);
    expect(roundTripped.surrogate).toBe(source.surrogate);
  });

  it('re-interns into a fresh registry without bleeding surrogates', () => {
    const source = entityRefRegistry.intern({ kind: 'pgc', id: 'PGC 2557' });
    const fresh = new EntityRefRegistry();
    const again = deserialise(serialise(source), fresh);
    expect(again.kind).toBe('pgc');
    expect(again.id).toBe('PGC 2557');
    expect(again.surrogate).toBe(1); // fresh registry starts fresh
  });
});

describe('refsEqual', () => {
  it('compares by (kind, id), ignoring registry provenance', () => {
    const a = entityRefRegistry.intern({ kind: 'gaia', id: '1234' });
    const b = new EntityRefRegistry().intern({ kind: 'gaia', id: '1234' });
    expect(refsEqual(a, b)).toBe(true);
  });

  it('returns false when either side is null', () => {
    const a = entityRefRegistry.intern({ kind: 'gaia', id: '1234' });
    expect(refsEqual(a, null)).toBe(false);
    expect(refsEqual(null, null)).toBe(true);
  });
});
