import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiEphemerisRange } from '@/api';

import { EphemerisSampler, type EphemerisSamplerEvent } from '../EphemerisSampler';

const AU_KM = 149_597_870.7;
const J2000 = 2_451_545.0;

/**
 * Build a `[x, y, z][]` array for a smooth parametric trajectory — we use
 * it to feed the sampler deterministic fetch responses without spinning
 * up a SPICE backend. The default parametrisation is a circular orbit of
 * Earth-ish radius so the numbers look sane in assertions.
 */
function makeRange(
  naifId: number,
  startJD: number,
  endJD: number,
  stepDays: number,
  traj: (jd: number) => [number, number, number] = (jd) => {
    const theta = (jd - J2000) * 0.01720;  // ~Earth mean motion
    return [Math.cos(theta), Math.sin(theta), 0];
  },
): ApiEphemerisRange {
  const positions: Array<[number, number, number]> = [];
  const count = Math.round((endJD - startJD) / stepDays) + 1;
  for (let i = 0; i < count; i++) {
    const jd = startJD + i * stepDays;
    positions.push(traj(jd));
  }
  return {
    naif_id: naifId,
    name: `body-${naifId}`,
    frame: 'ECLIPJ2000',
    observer: 10,
    start_jd: startJD,
    end_jd: endJD,
    step_days: stepDays,
    positions,
    count: positions.length,
  };
}

/**
 * Resolve all pending microtasks so the sampler's async fetcher settles
 * before the next `sample` call reads the cache. Single `await` is enough
 * because our mock fetcher resolves synchronously.
 */
async function drain(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('EphemerisSampler', () => {
  let now = 1_000_000;
  beforeEach(() => {
    now = 1_000_000;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null before the first fetch resolves and kicks off a prefetch', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 365, J2000 + 365, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });

    expect(sampler.sample(399, J2000)).toBeNull();
    // One fetch in-flight for the initial miss.
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sampler.getCacheStatus(399)).toBe('loading');

    // Second call mid-flight should not fire another fetch.
    expect(sampler.sample(399, J2000)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await drain();
    expect(sampler.getCacheStatus(399)).toBe('ready');
  });

  it('converts AU → km when applying a fetched range', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      makeRange(399, J2000 - 1, J2000 + 1, 1, () => [1, 0, 0]),
    );
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);  // kick fetch
    await drain();

    const out = sampler.sample(399, J2000);
    expect(out).not.toBeNull();
    expect(out!.x).toBeCloseTo(AU_KM, 6);
    expect(out!.y).toBeCloseTo(0, 6);
  });

  it('interpolates smoothly between two known samples', async () => {
    // Straight-line trajectory so cubic degrades to linear and we can
    // assert the midpoint directly.
    const fetcher = vi.fn().mockResolvedValue(
      makeRange(399, J2000, J2000 + 4, 1, (jd) => [jd - J2000, 0, 0]),
    );
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);
    await drain();

    // Midpoint between index 1 (x=1 AU) and index 2 (x=2 AU) → expect 1.5 AU.
    const mid = sampler.sample(399, J2000 + 1.5);
    expect(mid).not.toBeNull();
    expect(mid!.x).toBeCloseTo(1.5 * AU_KM, 3);
  });

  it('returns null when jd is scrubbed outside the cached window', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 1, J2000 + 1, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399, windowDays: 2 });
    sampler.sample(399, J2000);
    await drain();

    // 50 days past the cached end — null + kicks a refetch.
    const outOfRange = sampler.sample(399, J2000 + 50);
    expect(outOfRange).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('marks status=error and backs off after a failed fetch', async () => {
    const err = new Error('boom');
    const fetcher = vi.fn().mockRejectedValue(err);
    const events: EphemerisSamplerEvent[] = [];
    const sampler = new EphemerisSampler({
      fetcher,
      now: () => now,
      retryBackoffMs: 10_000,
      onEvent: (event) => events.push(event),
    });
    sampler.register({ naifId: 399 });

    sampler.sample(399, J2000);
    await drain();

    expect(sampler.getCacheStatus(399)).toBe('error');
    expect(events.some((e) => e.type === 'fetch-error')).toBe(true);

    // Second sample inside backoff window should NOT fire a second fetch.
    sampler.sample(399, J2000);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Advance the clock past the backoff — next sample retries.
    now += 20_000;
    sampler.sample(399, J2000);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('drops stale fetch resolutions after a newer prefetch wins', async () => {
    let resolveFirst: (value: ApiEphemerisRange) => void = () => {};
    const firstPromise = new Promise<ApiEphemerisRange>((res) => {
      resolveFirst = res;
    });
    const secondRange = makeRange(399, J2000 - 10, J2000 + 10, 1);
    const fetcher = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValue(secondRange);
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });

    sampler.sample(399, J2000);  // kick #1 (unresolved)
    await sampler.prefetch(399, J2000);  // kick #2 (resolves immediately)

    // Now resolve the stale #1. It should be dropped.
    resolveFirst(makeRange(399, J2000 - 999, J2000 + 999, 1));
    await drain();

    const win = sampler.getCacheWindow(399);
    expect(win).not.toBeNull();
    // Cache should reflect the SECOND fetch's tight window, not the first.
    expect(win!.startJD).toBe(J2000 - 10);
    expect(win!.endJD).toBe(J2000 + 10);
  });

  it('triggers a background prefetch when near the cached window edge', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 10, J2000 + 10, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399, refetchThreshold: 0.2, windowDays: 20 });

    sampler.sample(399, J2000);
    await drain();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Sample near the right edge (within 20% of the end) — should prefetch.
    const edgeJd = J2000 + 9;
    const result = sampler.sample(399, edgeJd);
    expect(result).not.toBeNull();            // we still got a value this frame
    expect(fetcher).toHaveBeenCalledTimes(2); // and a prefetch was started
  });

  it('returns null and emits throttled event above maxPlaybackDaysPerSec', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 10, J2000 + 10, 1));
    const events: EphemerisSamplerEvent[] = [];
    const sampler = new EphemerisSampler({
      fetcher,
      now: () => now,
      maxPlaybackDaysPerSec: 10,
      onEvent: (event) => events.push(event),
    });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);
    await drain();

    sampler.setPlaybackContext(100); // 100 days/s — above threshold
    expect(sampler.sample(399, J2000)).toBeNull();
    expect(events.some((e) => e.type === 'throttled')).toBe(true);

    // Below threshold resumes sampling.
    sampler.setPlaybackContext(1);
    expect(sampler.sample(399, J2000)).not.toBeNull();
  });

  it('register is idempotent for unchanged configs, resets otherwise', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 1, J2000 + 1, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399, windowDays: 2 });
    sampler.sample(399, J2000);
    await drain();
    expect(sampler.getCacheWindow(399)).not.toBeNull();

    // Same config → cache preserved.
    sampler.register({ naifId: 399, windowDays: 2 });
    expect(sampler.getCacheWindow(399)).not.toBeNull();

    // Different config → fresh entry (cache cleared, status reset).
    sampler.register({ naifId: 399, windowDays: 10 });
    expect(sampler.getCacheStatus(399)).toBe('idle');
    expect(sampler.getCacheWindow(399)).toBeNull();
  });

  it('unregister drops the entry entirely', () => {
    const sampler = new EphemerisSampler({
      fetcher: vi.fn(),
      now: () => now,
    });
    sampler.register({ naifId: 399 });
    sampler.unregister(399);
    expect(sampler.getCacheStatus(399)).toBe('unknown');
  });

  it('sample returns null without a registered body', () => {
    const sampler = new EphemerisSampler({ fetcher: vi.fn(), now: () => now });
    expect(sampler.sample(999, J2000)).toBeNull();
  });

  it('rejects invalid NAIF ids at registration time', () => {
    const sampler = new EphemerisSampler({ fetcher: vi.fn(), now: () => now });
    expect(() => sampler.register({ naifId: -1 })).toThrow(/invalid NAIF id/i);
    expect(() => sampler.register({ naifId: 1.5 })).toThrow(/invalid NAIF id/i);
  });

  it('dispose stops further fetches and answers', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 1, J2000 + 1, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);
    await drain();

    sampler.dispose();
    expect(sampler.sample(399, J2000)).toBeNull();
    expect(sampler.getCacheStatus(399)).toBe('unknown');
  });

  it('applyPushFrame overrides interp for samples within tolerance', async () => {
    // Straight line so interp gives a predictable baseline.
    const fetcher = vi.fn().mockResolvedValue(
      makeRange(399, J2000, J2000 + 4, 1, (jd) => [jd - J2000, 0, 0]),
    );
    const sampler = new EphemerisSampler({
      fetcher,
      now: () => now,
      pushFrameToleranceDays: 0.5,
    });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);
    await drain();

    // Without a push frame: interp says x = 1.5 AU at jd = J2000 + 1.5.
    const interp = sampler.sample(399, J2000 + 1.5);
    expect(interp!.x).toBeCloseTo(1.5 * AU_KM, 3);

    // Push frame says "actually the server just told me x = 99 AU at this epoch".
    sampler.applyPushFrame(399, J2000 + 1.5, { x: 99, y: 0, z: 0 });
    const pushed = sampler.sample(399, J2000 + 1.5);
    expect(pushed!.x).toBeCloseTo(99 * AU_KM, 3);

    // Just inside tolerance — still the push value.
    const nearby = sampler.sample(399, J2000 + 1.5 + 0.4);
    expect(nearby!.x).toBeCloseTo(99 * AU_KM, 3);

    // Past the tolerance window — falls back to interp.
    const farAway = sampler.sample(399, J2000 + 3.0);
    expect(farAway!.x).toBeCloseTo(3.0 * AU_KM, 3);
  });

  it('applyPushFrame feeds a body whose cache is still cold', () => {
    const fetcher = vi.fn(() => new Promise<ApiEphemerisRange>(() => {})); // never resolves
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000); // starts fetch, never resolves
    expect(sampler.sample(399, J2000)).toBeNull();

    sampler.applyPushFrame(399, J2000, { x: 2, y: 0, z: 0 });
    const pushed = sampler.sample(399, J2000);
    expect(pushed).not.toBeNull();
    expect(pushed!.x).toBeCloseTo(2 * AU_KM, 3);
  });

  it('applyPushFrame silently ignores unknown bodies and non-finite epochs', () => {
    const sampler = new EphemerisSampler({ fetcher: vi.fn(), now: () => now });
    sampler.register({ naifId: 399 });
    // Should not throw.
    sampler.applyPushFrame(9999, J2000, { x: 1, y: 0, z: 0 });
    sampler.applyPushFrame(399, Number.NaN, { x: 1, y: 0, z: 0 });
    expect(sampler.sample(399, J2000)).toBeNull();
  });

  it('clear() drops live push points along with the cached range', async () => {
    const fetcher = vi.fn().mockResolvedValue(makeRange(399, J2000 - 1, J2000 + 1, 1));
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.applyPushFrame(399, J2000, { x: 7, y: 0, z: 0 });
    expect(sampler.sample(399, J2000)!.x).toBeCloseTo(7 * AU_KM, 3);
    sampler.clear();
    expect(sampler.sample(399, J2000)).toBeNull(); // cache cold, live point dropped
  });

  it('cubic-interpolates a quadratic curve more accurately than linear', async () => {
    // y = t²; with step=1 the cubic should recover the midpoint near-exactly.
    const fetcher = vi.fn().mockResolvedValue(
      makeRange(399, J2000, J2000 + 4, 1, (jd) => {
        const t = jd - J2000;
        return [t, t * t, 0];
      }),
    );
    const sampler = new EphemerisSampler({ fetcher, now: () => now });
    sampler.register({ naifId: 399 });
    sampler.sample(399, J2000);
    await drain();

    const out = sampler.sample(399, J2000 + 2.5);
    expect(out).not.toBeNull();
    // Expected y = 2.5² = 6.25 AU. Catmull-Rom on a quadratic is exact.
    expect(out!.y).toBeCloseTo(6.25 * AU_KM, 0);
  });
});
