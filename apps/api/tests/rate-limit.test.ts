import { describe, expect, it } from 'vitest';

import { TIER_LIMITS } from '../src/middleware/rate-limit.js';

describe('rate-limit tier table', () => {
  it('matches Doc 26 §13 limits', () => {
    expect(TIER_LIMITS.anonymous.max).toBe(60);
    expect(TIER_LIMITS.registered.max).toBe(300);
    expect(TIER_LIMITS.research.max).toBe(1000);
    expect(TIER_LIMITS.internal.max).toBe(false);
  });

  it('each tier uses a 1-minute window', () => {
    for (const cfg of Object.values(TIER_LIMITS)) {
      expect(cfg.timeWindow).toBe('1 minute');
    }
  });
});
