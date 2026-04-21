import type { BufferAttribute, BufferGeometry} from 'three';
import { Points, ShaderMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateStarSeed, type StarSeed } from '@/data/starSeed';

import { StarFieldRenderer } from '../StarFieldRenderer';

describe('StarFieldRenderer', () => {
  let renderer: StarFieldRenderer;

  beforeEach(() => {
    renderer = new StarFieldRenderer({ pointSizeScale: 1, bloomThreshold: 1.5 });
  });
  afterEach(() => {
    renderer.dispose();
  });

  it('constructs a Points mesh with a ShaderMaterial attached', () => {
    expect(renderer.points).toBeInstanceOf(Points);
    expect(renderer.material).toBeInstanceOf(ShaderMaterial);
    expect(renderer.points.frustumCulled).toBe(true);
    expect(renderer.points.name).toBe('star-field');
  });

  it('setSeed populates all four per-star attributes', () => {
    const seed = generateStarSeed({ count: 200, seed: 1 });
    renderer.setSeed(seed);

    const geometry = renderer.points.geometry as BufferGeometry;
    const position = geometry.getAttribute('position') as BufferAttribute;
    const color = geometry.getAttribute('a_color') as BufferAttribute;
    const magnitude = geometry.getAttribute('a_magnitude') as BufferAttribute;
    const phase = geometry.getAttribute('a_twinklePhase') as BufferAttribute;

    expect(position.count).toBe(200);
    expect(color.count).toBe(200);
    expect(magnitude.count).toBe(200);
    expect(phase.count).toBe(200);
    expect(position.itemSize).toBe(3);
    expect(color.itemSize).toBe(3);
  });

  it('computes a bounding sphere that encloses every seed position', () => {
    const seed: StarSeed[] = [
      { position: { x: 10, y: 0, z: 0 }, color: { r: 1, g: 1, b: 1 }, magnitude: 0, spectralClass: 'G', twinklePhase: 0 },
      { position: { x: -10, y: 0, z: 0 }, color: { r: 1, g: 1, b: 1 }, magnitude: 0, spectralClass: 'G', twinklePhase: 0 },
      { position: { x: 0, y: 10, z: 0 }, color: { r: 1, g: 1, b: 1 }, magnitude: 0, spectralClass: 'G', twinklePhase: 0 },
    ];
    renderer.setSeed(seed);
    const sphere = renderer.points.geometry.boundingSphere!;
    expect(sphere).toBeTruthy();
    for (const star of seed) {
      const d = Math.hypot(
        star.position.x - sphere.center.x,
        star.position.y - sphere.center.y,
        star.position.z - sphere.center.z,
      );
      expect(d).toBeLessThanOrEqual(sphere.radius + 1e-6);
    }
  });

  it('handles an empty seed gracefully', () => {
    renderer.setSeed([]);
    const geometry = renderer.points.geometry as BufferGeometry;
    expect(geometry.getAttribute('position').count).toBe(0);
    expect(geometry.boundingSphere?.radius).toBe(0);
  });

  it('update() advances the u_time uniform', () => {
    renderer.setSeed(generateStarSeed({ count: 10 }));
    renderer.update(2.5);
    expect(renderer.material.uniforms.u_time?.value).toBeCloseTo(2.5);
  });

  it('rebuildAfterContextRestore bumps the version of every attribute', () => {
    renderer.setSeed(generateStarSeed({ count: 10 }));
    const attrs = ['position', 'a_color', 'a_magnitude', 'a_twinklePhase'];
    const beforeVersions = attrs.map((name) => {
      const attr = renderer.points.geometry.getAttribute(name) as BufferAttribute;
      return attr.version;
    });
    renderer.rebuildAfterContextRestore();
    attrs.forEach((name, i) => {
      const attr = renderer.points.geometry.getAttribute(name) as BufferAttribute;
      expect(attr.version).toBeGreaterThan(beforeVersions[i]!);
    });
  });

  it('dispose releases geometry and material resources', () => {
    renderer.setSeed(generateStarSeed({ count: 10 }));
    const geometry = renderer.points.geometry;
    const material = renderer.material;
    renderer.dispose();
    // Three.js does not mark resources internally, but calling dispose twice
    // must be safe — no throw.
    expect(() => geometry.dispose()).not.toThrow();
    expect(() => material.dispose()).not.toThrow();
  });

  it('setSeed replaces previous data', () => {
    renderer.setSeed(generateStarSeed({ count: 100 }));
    renderer.setSeed(generateStarSeed({ count: 50 }));
    expect(renderer.points.geometry.getAttribute('position').count).toBe(50);
    expect(renderer.getSeed()).toHaveLength(50);
  });
});
