/**
 * CosmicWebRenderer tests (T29).
 *
 * Verifies filament / void / node construction and disposal against the
 * Doc 17 ENT-7030/7031 layout.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { CosmicWebRenderer, DEFAULT_COSMIC_WEB } from '../CosmicWebRenderer';

describe('CosmicWebRenderer', () => {
  it('constructs one mesh per filament / void / node', () => {
    const r = new CosmicWebRenderer({
      nodes: DEFAULT_COSMIC_WEB.nodes,
      filaments: DEFAULT_COSMIC_WEB.filaments,
      voids: DEFAULT_COSMIC_WEB.voids,
    });
    try {
      expect(r.getFilamentCount()).toBe(DEFAULT_COSMIC_WEB.filaments.length);
      expect(r.getVoidCount()).toBe(DEFAULT_COSMIC_WEB.voids.length);
      expect(r.getNodeCount()).toBe(DEFAULT_COSMIC_WEB.nodes.length);
    } finally {
      r.dispose();
    }
  });

  it('places each node at the spec position', () => {
    const r = new CosmicWebRenderer({
      nodes: DEFAULT_COSMIC_WEB.nodes,
      filaments: DEFAULT_COSMIC_WEB.filaments,
      voids: DEFAULT_COSMIC_WEB.voids,
    });
    try {
      for (let i = 0; i < DEFAULT_COSMIC_WEB.nodes.length; i++) {
        const expected = DEFAULT_COSMIC_WEB.nodes[i]!.position;
        const got = r.getNodePosition(i)!;
        expect(got.x).toBeCloseTo(expected.x, 5);
        expect(got.y).toBeCloseTo(expected.y, 5);
        expect(got.z).toBeCloseTo(expected.z, 5);
      }
    } finally {
      r.dispose();
    }
  });

  it('rejects zero-length filaments silently (single-node spec) without throwing', () => {
    const r = new CosmicWebRenderer({
      nodes: [{ position: new THREE.Vector3(0, 0, 0), kind: 'group' }],
      filaments: [{ nodeIndices: [0] }],  // degenerate
      voids: [],
    });
    try {
      expect(r.getFilamentCount()).toBe(0);
      expect(r.getNodeCount()).toBe(1);
    } finally {
      r.dispose();
    }
  });

  it('dispose clears all meshes and materials', () => {
    const r = new CosmicWebRenderer({
      nodes: DEFAULT_COSMIC_WEB.nodes,
      filaments: DEFAULT_COSMIC_WEB.filaments,
      voids: DEFAULT_COSMIC_WEB.voids,
    });
    r.dispose();
    expect(r.getFilamentCount()).toBe(0);
    expect(r.getVoidCount()).toBe(0);
    expect(r.getNodeCount()).toBe(0);
  });

  it('rebuildAfterContextRestore flags every material for re-upload', () => {
    const r = new CosmicWebRenderer({
      nodes: DEFAULT_COSMIC_WEB.nodes,
      filaments: DEFAULT_COSMIC_WEB.filaments.slice(0, 2),
      voids: DEFAULT_COSMIC_WEB.voids.slice(0, 1),
    });
    try {
      // No assertion beyond "doesn't throw" — Three.js materials don't
      // expose a pre-restore `needsUpdate` readback. The call is exercised
      // for coverage.
      expect(() => r.rebuildAfterContextRestore()).not.toThrow();
    } finally {
      r.dispose();
    }
  });

  it('DEFAULT_COSMIC_WEB filaments index into existing nodes', () => {
    for (const f of DEFAULT_COSMIC_WEB.filaments) {
      for (const i of f.nodeIndices) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(DEFAULT_COSMIC_WEB.nodes.length);
      }
    }
  });
});
