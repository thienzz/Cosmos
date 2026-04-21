import { describe, expect, it, vi } from 'vitest';

import {
  AU_PER_KPC,
  AU_PER_MPC,
  AU_PER_PC,
  DEFAULT_THRESHOLDS,
  isAddressRelevantForRegime,
  REGIME_TILE_KINDS,
  ScaleRegimeController,
  regimeRank,
  tileKindFromAddress,
  type RegimeTransition,
} from '../ScaleRegimeController';

describe('ScaleRegimeController', () => {
  describe('TS-NAV-004 — transitions both directions', () => {
    it('solar_system → stellar when distance exceeds enter threshold', () => {
      const onT = vi.fn();
      const c = new ScaleRegimeController({ onTransition: onT });
      expect(c.update(100)).toBe(false);
      expect(c.update(500)).toBe(false); // boundary, not strictly greater
      expect(c.update(501)).toBe(true);
      expect(c.current).toBe('stellar');
      expect(onT).toHaveBeenCalledWith<[RegimeTransition]>({
        from: 'solar_system',
        to: 'stellar',
        distanceAU: 501,
      });
    });

    it('stellar → solar_system when distance drops below exit threshold', () => {
      const c = new ScaleRegimeController({ initial: 'stellar' });
      expect(c.update(450)).toBe(false); // still above exit 400
      expect(c.update(400)).toBe(false); // boundary
      expect(c.update(399)).toBe(true);
      expect(c.current).toBe('solar_system');
    });

    it('stellar → galactic beyond 1 kpc', () => {
      const c = new ScaleRegimeController({ initial: 'stellar' });
      expect(c.update(1_000 * AU_PER_PC)).toBe(false); // exactly at threshold
      expect(c.update(1_001 * AU_PER_PC)).toBe(true);
      expect(c.current).toBe('galactic');
    });

    it('galactic → stellar below 800 pc', () => {
      const c = new ScaleRegimeController({ initial: 'galactic' });
      expect(c.update(900 * AU_PER_PC)).toBe(false);
      expect(c.update(799 * AU_PER_PC)).toBe(true);
      expect(c.current).toBe('stellar');
    });

    it('galactic → cosmic beyond 1 Mpc', () => {
      const c = new ScaleRegimeController({ initial: 'galactic' });
      expect(c.update(0.9 * AU_PER_MPC)).toBe(false);
      expect(c.update(1.5 * AU_PER_MPC)).toBe(true);
      expect(c.current).toBe('cosmic');
    });

    it('cosmic → galactic below 0.8 Mpc', () => {
      const c = new ScaleRegimeController({ initial: 'cosmic' });
      expect(c.update(0.9 * AU_PER_MPC)).toBe(false);
      expect(c.update(0.7 * AU_PER_MPC)).toBe(true);
      expect(c.current).toBe('galactic');
    });

    it('climbs one rung per update() — two rungs need two calls', () => {
      const c = new ScaleRegimeController();
      // Dump the camera at cosmic distance in one call.
      c.update(5 * AU_PER_MPC);
      expect(c.current).toBe('stellar');
      c.update(5 * AU_PER_MPC);
      expect(c.current).toBe('galactic');
      c.update(5 * AU_PER_MPC);
      expect(c.current).toBe('cosmic');
      expect(c.update(5 * AU_PER_MPC)).toBe(false);
    });
  });

  describe('TS-NAV-005 — hysteresis prevents flicker at boundaries', () => {
    it('oscillating on the Solar→Stellar threshold does not bounce the regime', () => {
      const onT = vi.fn();
      const c = new ScaleRegimeController({ onTransition: onT });
      // Promote once.
      c.update(501);
      expect(c.current).toBe('stellar');
      // Now jiggle around 450 ± tiny. Stays stellar (exit = 400).
      for (let i = 0; i < 50; i++) {
        c.update(450 + Math.sin(i) * 5);
      }
      expect(c.current).toBe('stellar');
      expect(onT).toHaveBeenCalledTimes(1);
    });

    it('oscillating on the Stellar→Galactic band is also stable', () => {
      const onT = vi.fn();
      const c = new ScaleRegimeController({ initial: 'stellar', onTransition: onT });
      c.update(1_001 * AU_PER_PC);
      expect(c.current).toBe('galactic');
      // Bounce inside the 800–1000 pc band (hysteresis zone).
      for (let i = 0; i < 50; i++) {
        c.update((900 + Math.sin(i) * 50) * AU_PER_PC);
      }
      expect(c.current).toBe('galactic');
      expect(onT).toHaveBeenCalledTimes(1);
    });

    it('camera parked on the boundary does not emit a transition', () => {
      const onT = vi.fn();
      const c = new ScaleRegimeController({ onTransition: onT });
      for (let i = 0; i < 100; i++) c.update(500); // exactly the enter threshold
      expect(c.current).toBe('solar_system');
      expect(onT).not.toHaveBeenCalled();
    });
  });

  describe('pure / defensive inputs', () => {
    it('NaN / negative / infinite distance is ignored', () => {
      const c = new ScaleRegimeController();
      expect(c.update(Number.NaN)).toBe(false);
      expect(c.update(-1)).toBe(false);
      expect(c.update(Number.POSITIVE_INFINITY)).toBe(false);
      expect(c.current).toBe('solar_system');
    });

    it('reset() jumps without firing callback', () => {
      const onT = vi.fn();
      const c = new ScaleRegimeController({ onTransition: onT });
      c.reset('cosmic');
      expect(c.current).toBe('cosmic');
      expect(onT).not.toHaveBeenCalled();
    });

    it('custom thresholds are honoured', () => {
      const c = new ScaleRegimeController({
        thresholds: {
          ...DEFAULT_THRESHOLDS,
          solarToStellar: { enter: 10, exit: 5 },
        },
      });
      c.update(11);
      expect(c.current).toBe('stellar');
      c.update(6);
      expect(c.current).toBe('stellar');
      c.update(4);
      expect(c.current).toBe('solar_system');
    });
  });

  it('regimeRank gives a total order matching the ladder', () => {
    expect(regimeRank('solar_system')).toBe(0);
    expect(regimeRank('stellar')).toBe(1);
    expect(regimeRank('galactic')).toBe(2);
    expect(regimeRank('cosmic')).toBe(3);
  });
});

describe('tileKindFromAddress', () => {
  it('matches all three prefixes plus tolerates leading slash / underscore', () => {
    expect(tileKindFromAddress('stars/5/128/64/3')).toBe('stars');
    expect(tileKindFromAddress('/stars/5/128/64/3')).toBe('stars');
    expect(tileKindFromAddress('galaxies/1024')).toBe('galaxies');
    expect(tileKindFromAddress('cosmic-web/3')).toBe('cosmic_web');
    expect(tileKindFromAddress('cosmic_web/3')).toBe('cosmic_web');
  });

  it('returns null for unknown shapes', () => {
    expect(tileKindFromAddress('cmb/0')).toBeNull();
    expect(tileKindFromAddress('')).toBeNull();
  });
});

describe('isAddressRelevantForRegime', () => {
  it('solar_system filters out all tile kinds', () => {
    for (const addr of ['stars/0/0/0/0', 'galaxies/1', 'cosmic-web/3']) {
      expect(isAddressRelevantForRegime(addr, 'solar_system')).toBe(false);
    }
  });

  it('stellar admits star tiles only', () => {
    expect(isAddressRelevantForRegime('stars/3/12/5/2', 'stellar')).toBe(true);
    expect(isAddressRelevantForRegime('galaxies/1024', 'stellar')).toBe(false);
    expect(isAddressRelevantForRegime('cosmic-web/3', 'stellar')).toBe(false);
  });

  it('galactic admits star + galaxy tiles', () => {
    expect(isAddressRelevantForRegime('stars/3/12/5/2', 'galactic')).toBe(true);
    expect(isAddressRelevantForRegime('galaxies/1024', 'galactic')).toBe(true);
    expect(isAddressRelevantForRegime('cosmic-web/3', 'galactic')).toBe(false);
  });

  it('cosmic admits galaxy + cosmic-web tiles', () => {
    expect(isAddressRelevantForRegime('stars/3/12/5/2', 'cosmic')).toBe(false);
    expect(isAddressRelevantForRegime('galaxies/1024', 'cosmic')).toBe(true);
    expect(isAddressRelevantForRegime('cosmic-web/3', 'cosmic')).toBe(true);
  });

  it('unknown prefixes pass through (forward-compat)', () => {
    expect(isAddressRelevantForRegime('cmb/0', 'cosmic')).toBe(true);
  });

  it('REGIME_TILE_KINDS declares per-regime sets', () => {
    expect(Array.from(REGIME_TILE_KINDS.solar_system)).toEqual([]);
    expect(new Set(REGIME_TILE_KINDS.stellar)).toEqual(new Set(['stars']));
    expect(new Set(REGIME_TILE_KINDS.galactic)).toEqual(new Set(['stars', 'galaxies']));
    expect(new Set(REGIME_TILE_KINDS.cosmic)).toEqual(new Set(['galaxies', 'cosmic_web']));
  });
});

describe('unit conversions', () => {
  it('1 kpc in AU is the Doc-cited constant', () => {
    expect(AU_PER_KPC).toBeCloseTo(206_264_806, 0);
  });
  it('1 Mpc in AU is a billion-times-larger', () => {
    expect(AU_PER_MPC).toBeCloseTo(AU_PER_KPC * 1000);
  });
});
