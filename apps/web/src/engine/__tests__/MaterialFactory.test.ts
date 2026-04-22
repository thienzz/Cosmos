import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  MaterialFactory,
  createMaterialForEntity,
  listKnownKinds,
  listRegisteredShaders,
} from '../MaterialFactory';

describe('MaterialFactory', () => {
  describe('render-block path', () => {
    it('builds material from explicit render.shader', () => {
      const { material, shaderKey } = createMaterialForEntity({
        kind: 'rocky_planet',
        render: { shader: 'planet-rocky' },
      });
      expect(shaderKey).toBe('planet-rocky');
      expect(material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(material.name).toBe('planet-rocky');
      expect(material.glslVersion).toBe(THREE.GLSL3);
    });

    it('applies compile-time #define flags from render.defines', () => {
      const { material } = createMaterialForEntity({
        render: {
          shader: 'planet-rocky',
          defines: { ROCKY_VENUS: true, HAS_CO2_ATMOSPHERE: 1 },
        },
      });
      expect(material.defines).toMatchObject({
        ROCKY_VENUS: '1',
        HAS_CO2_ATMOSPHERE: '1',
      });
    });

    it('materialises scalar + Vec3 uniforms from render.uniforms', () => {
      const { material } = createMaterialForEntity({
        render: {
          shader: 'planet-rocky',
          uniforms: {
            u_surfaceAlbedo: 0.67,
            u_atmosphereColor: [0.96, 0.82, 0.5],
          },
        },
      });
      expect(material.uniforms.u_surfaceAlbedo.value).toBe(0.67);
      const tint = material.uniforms.u_atmosphereColor.value as THREE.Vector3;
      expect(tint).toBeInstanceOf(THREE.Vector3);
      expect(tint.x).toBeCloseTo(0.96);
      expect(tint.y).toBeCloseTo(0.82);
      expect(tint.z).toBeCloseTo(0.5);
    });

    it('always attaches standard uniforms (time, log depth, camera origin)', () => {
      const { material } = createMaterialForEntity({
        render: { shader: 'moon-icy' },
      });
      expect(material.uniforms.u_time.value).toBe(0);
      expect(material.uniforms.u_logDepthCoef.value).toBeGreaterThan(0);
      expect(material.uniforms.u_cameraRelativeOrigin.value).toBeInstanceOf(
        THREE.Vector3,
      );
    });

    it('respects cameraRelativeOrigin + logDepthCoef overrides', () => {
      const origin = new THREE.Vector3(1, 2, 3);
      const { material } = createMaterialForEntity(
        { render: { shader: 'moon-icy' } },
        { cameraRelativeOrigin: origin, logDepthCoef: 0.125 },
      );
      const seeded = material.uniforms.u_cameraRelativeOrigin
        .value as THREE.Vector3;
      expect(seeded).toBeInstanceOf(THREE.Vector3);
      expect(seeded.equals(origin)).toBe(true);
      // Must be a defensive clone, not a shared reference.
      expect(seeded).not.toBe(origin);
      expect(material.uniforms.u_logDepthCoef.value).toBe(0.125);
    });
  });

  describe('legacy kind fallback', () => {
    it('derives shader from kind when no render block is present', () => {
      const cases: Array<[string, string]> = [
        ['rocky_planet', 'planet-rocky'],
        ['gas_giant', 'planet-gas'],
        ['extreme_planet', 'planet-extreme'],
        ['icy_moon', 'moon-icy'],
        ['main_sequence', 'star-mainseq'],
        ['black_hole', 'exotic-blackhole'],
      ];
      for (const [kind, expected] of cases) {
        const { shaderKey } = createMaterialForEntity({ kind });
        expect(shaderKey, `kind=${kind}`).toBe(expected);
      }
    });

    it('falls back to object_type when kind is missing', () => {
      const { shaderKey } = createMaterialForEntity({ object_type: 'galaxy' });
      expect(shaderKey).toBe('galaxy-spiral');
    });

    it('prefers render.shader over kind when both are present', () => {
      const { shaderKey } = createMaterialForEntity({
        kind: 'rocky_planet',
        render: { shader: 'planet-gas' },
      });
      expect(shaderKey).toBe('planet-gas');
    });
  });

  describe('error paths', () => {
    it('throws when neither render.shader, kind, nor object_type resolve', () => {
      expect(() => createMaterialForEntity({})).toThrow(
        /cannot resolve shader/,
      );
    });

    it('throws when render.shader is not in the registry', () => {
      expect(() =>
        createMaterialForEntity({ render: { shader: 'does-not-exist' } }),
      ).toThrow(/unknown shader/);
    });

    it('throws when define value is a non-integer number', () => {
      expect(() =>
        createMaterialForEntity({
          render: { shader: 'planet-rocky', defines: { BAD: 0.5 } },
        }),
      ).toThrow(/integer or boolean/);
    });

    it('throws when uniform value is a non-finite number', () => {
      expect(() =>
        createMaterialForEntity({
          render: {
            shader: 'planet-rocky',
            uniforms: { u_bad: Number.POSITIVE_INFINITY },
          },
        }),
      ).toThrow(/must be finite/);
    });

    it('throws when uniform array length is not 2/3/4', () => {
      expect(() =>
        createMaterialForEntity({
          render: {
            shader: 'planet-rocky',
            uniforms: { u_bad: [1, 2, 3, 4, 5] },
          },
        }),
      ).toThrow(/length must be 2, 3, or 4/);
    });
  });

  describe('registry introspection', () => {
    it('lists all registered shader keys', () => {
      const keys = listRegisteredShaders();
      expect(keys).toContain('planet-rocky');
      expect(keys).toContain('moon-icy');
      expect(keys).toContain('galaxy-spiral');
      expect(keys).toContain('exotic-blackhole');
      expect(keys.length).toBeGreaterThanOrEqual(40);
    });

    it('lists known kinds covering the core ObjectType set', () => {
      const kinds = listKnownKinds();
      expect(kinds).toEqual(
        expect.arrayContaining([
          'star',
          'planet',
          'moon',
          'galaxy',
          'nebula',
          'cluster',
          'asteroid',
          'comet',
        ]),
      );
    });

    it('MaterialFactory facade re-exports the same helpers', () => {
      expect(MaterialFactory.create).toBe(createMaterialForEntity);
      expect(MaterialFactory.listRegisteredShaders).toBe(listRegisteredShaders);
      expect(MaterialFactory.listKnownKinds).toBe(listKnownKinds);
    });
  });
});
