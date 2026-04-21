import { describe, expect, it } from 'vitest';

import {
  entIdForBody,
  entityDataByNaif,
  entityPreviewByNaif,
  KIND_ACCENT_COLOR,
  KIND_ICON,
  toEntityData,
  toEntityPreview,
} from '../bodyToEntity';
import { namedCometById } from '../namedComets';
import { MAJOR_MOONS, PLANETS, SUN } from '../solarSystemCatalog';

describe('bodyToEntity', () => {
  it('maps the Sun to an ENT-1xxx id with star object_type', () => {
    const data = toEntityData(SUN);
    expect(data.name).toBe('Sun');
    expect(data.object_type).toBe('star');
    expect(data.ent_id).toMatch(/^ENT-1\d{3}$/);
    expect(data.id).toBe(SUN.naifId);
  });

  it('maps Earth as a planet with AU orbit distance', () => {
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    const data = toEntityData(earth);
    expect(data.object_type).toBe('planet');
    expect(data.payload.kindLabel).toBe('Planet');
    expect(data.payload.parentName).toBe('Sun');
    expect(data.payload.semiMajorAxis_unit).toBe('AU');
    expect(data.payload.semiMajorAxis_display).toBeCloseTo(1.0, 2);
    expect(data.payload.periodDays as number).toBeCloseTo(365.25 * 1.000_017, 0);
  });

  it('maps Moon as moon with km orbit distance and Earth as parent', () => {
    const moon = MAJOR_MOONS.find((m) => m.name === 'Moon')!;
    const data = toEntityData(moon);
    expect(data.object_type).toBe('moon');
    expect(data.payload.parentName).toBe('Earth');
    expect(data.payload.semiMajorAxis_unit).toBe('km');
    expect(data.payload.semiMajorAxis_display).toBe(384_400);
  });

  it('flags retrograde moons (Triton — i>90°)', () => {
    const triton = MAJOR_MOONS.find((m) => m.name === 'Triton')!;
    const data = toEntityData(triton);
    expect(data.payload.isRetrograde).toBe(true);
  });

  it('carries AETHER V4 accent colour + glyph for each kind', () => {
    const jupiter = PLANETS.find((p) => p.name === 'Jupiter')!;
    const data = toEntityData(jupiter);
    expect(data.payload.accentColor).toBe(KIND_ACCENT_COLOR.planet);
    expect(data.payload.icon).toBe(KIND_ICON.planet);
  });

  it('ENT ID is deterministic for a given body', () => {
    const mercury = PLANETS.find((p) => p.name === 'Mercury')!;
    expect(entIdForBody(mercury)).toBe(entIdForBody(mercury));
  });

  it('entityDataByNaif / entityPreviewByNaif resolve known ids', () => {
    const saturn = PLANETS.find((p) => p.name === 'Saturn')!;
    expect(entityDataByNaif(saturn.naifId)?.name).toBe('Saturn');
    expect(entityPreviewByNaif(saturn.naifId)?.name).toBe('Saturn');
  });

  it('entityDataByNaif returns null for unknown ids', () => {
    expect(entityDataByNaif(-999_999)).toBeNull();
    expect(entityPreviewByNaif(-999_999)).toBeNull();
  });

  it('toEntityPreview carries distance in AU', () => {
    const mars = PLANETS.find((p) => p.name === 'Mars')!;
    const preview = toEntityPreview(mars);
    expect(preview.distance).toBeCloseTo(1.523_679, 3);
  });

  it('maps Halley to ENT-4022 Halley-type comet (T44)', () => {
    const halley = namedCometById(1_000_001);
    expect(halley).toBeDefined();
    const data = toEntityData(halley!);
    expect(data.ent_id).toBe('ENT-4022');
    expect(data.payload.kindLabel).toBe('Halley-type Comet');
    expect(data.payload.subtype).toBe('comet-halley-type');
  });

  it('maps C/2022 E3 (ZTF) to ENT-4021 long-period comet (T44)', () => {
    const ztf = namedCometById(1_000_006);
    expect(ztf).toBeDefined();
    const data = toEntityData(ztf!);
    expect(data.ent_id).toBe('ENT-4021');
    expect(data.payload.subtype).toBe('comet-long-period');
  });
});
