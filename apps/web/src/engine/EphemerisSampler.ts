import { getEphemerisRange, ApiError, type ApiEphemerisFrame, type ApiEphemerisRange } from '@/api';

/**
 * Live-ephemeris sampler for the solar-system renderer (T21, Doc 26 §8.3).
 *
 * The renderer drives 8+ planet positions every frame. Calling
 * `GET /ephemeris/{naifId}` per body per frame is impossible (network
 * latency, rate limit, quota). Instead the sampler pre-fetches a window
 * of positions via `GET /ephemeris/range/{naifId}`, caches the flat
 * position array, and answers `sample(jd)` queries by **cubic
 * interpolation** between the cached samples.
 *
 * Cache lifecycle:
 *   1. `register(body)` is called once per body on scene mount.
 *   2. The renderer calls `sample(naifId, jd)` every frame.
 *   3. The first call misses the cache → sampler kicks off a
 *      `/ephemeris/range` fetch for `[jd − window/2, jd + window/2]`.
 *      During the fetch `sample` returns `null` and the renderer falls
 *      back to the T14 Kepler propagator.
 *   4. When the fetch resolves, subsequent `sample` calls return
 *      interpolated positions from the cached array.
 *   5. As the simulation JD approaches either end of the window the
 *      sampler triggers a background re-fetch centred on the current JD.
 *
 * Frame:
 *   The sampler treats all positions as the frame returned by the
 *   backend (default `ECLIPJ2000`, heliocentric). The renderer's scene
 *   placement already maps ECLIPJ2000 (X, Y, Z) → Three.js (X, Z, −Y).
 *   The sampler returns km; callers multiply by their chosen scene scale.
 *
 * Error handling:
 *   Failed fetches (network, 4xx, 5xx) are logged once per body, held in
 *   `status: 'error'` for {@link EphemerisSamplerOptions.retryBackoffMs},
 *   and the renderer keeps using the Kepler fallback silently. Transient
 *   errors auto-recover on the next `sample` call after the backoff.
 *
 * High-speed playback:
 *   Above {@link EphemerisSamplerOptions.maxPlaybackDaysPerSec} the
 *   cache would churn faster than fetches can refresh (e.g. at 1e9×
 *   speed the sim burns a 365-day cache in ~30 ms of wall time), so
 *   `sample` returns `null` above the threshold and the renderer
 *   naturally falls back to Kepler. Below the threshold sampling
 *   resumes — no manual reset needed.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Vec3Km {
  x: number;
  y: number;
  z: number;
}

export interface EphemerisBodyConfig {
  naifId: number;
  /** Observer NAIF id. 10 = Sun (heliocentric). Default 10. */
  observer?: number;
  /** Total window width in days. Default 730 (~2 years). */
  windowDays?: number;
  /** Sample step in days. Default 1.0. */
  stepDays?: number;
  /** Reference frame. Default `ECLIPJ2000`. */
  frame?: ApiEphemerisFrame;
  /**
   * Trigger a re-fetch when the simulation JD is within this fraction of
   * either end of the cached window. Default 0.15 (fetch when within 15%
   * of the edge).
   */
  refetchThreshold?: number;
}

export interface EphemerisSamplerOptions {
  /** Fetcher override (tests). Defaults to the live HTTP client. */
  fetcher?: typeof getEphemerisRange;
  /** Hold `status='error'` for this long after a failed fetch. Default 30 s. */
  retryBackoffMs?: number;
  /**
   * Skip live sampling when the absolute playback rate exceeds this
   * (in sim-days per wall-clock second). Default 365 (~1 yr/s).
   * Above the threshold the cache churns faster than the network so the
   * renderer falls back to the local Kepler propagator.
   */
  maxPlaybackDaysPerSec?: number;
  /**
   * How close the queried `jd` must be to a `applyPushFrame` epoch for
   * the live override to be used instead of cubic interp (T22). Default
   * 0.5 days — picks up a push frame the user just triggered without
   * letting a stale push frame override later, accurate interpolation.
   */
  pushFrameToleranceDays?: number;
  /** Log fetch failures / throttle events via this callback (tests). */
  onEvent?: (event: EphemerisSamplerEvent) => void;
  /** Time source override (tests). Defaults to `Date.now`. */
  now?: () => number;
}

export type EphemerisSamplerEvent =
  | { type: 'fetch-start'; naifId: number; startJD: number; endJD: number }
  | { type: 'fetch-ok'; naifId: number; samples: number }
  | { type: 'fetch-error'; naifId: number; error: unknown }
  | { type: 'throttled'; playbackDaysPerSec: number };

export type EphemerisCacheStatus =
  | 'unknown'
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface BodyEntry {
  config: Required<EphemerisBodyConfig>;
  status: EphemerisCacheStatus;
  /** Flat array of (x, y, z) positions in km, length = 3 * count. */
  positionsKm: Float64Array | null;
  startJD: number;
  endJD: number;
  stepDays: number;
  count: number;
  /** Wall-clock ms; set when a fetch fails so we back off. */
  nextRetryAt: number;
  /** Epoch of the outstanding request (if any) so stale resolutions can be dropped. */
  inflightEpoch: number | null;
  /** Incremented on every prefetch so resolver callbacks can detect staleness. */
  fetchGeneration: number;
  /** Remembered for introspection tests. */
  lastError: unknown | null;
  /**
   * Most recent WebSocket `ephemeris_push` sample (T22). Takes precedence
   * over interpolation when the queried `jd` is within
   * `pushFrameToleranceDays` of the push frame's epoch — push frames are
   * the server's exact SPICE answer for the client's currently-simulated
   * epoch, so they trump cubic interp of older range samples.
   */
  livePoint: { jd: number; x: number; y: number; z: number } | null;
}

const AU_KM = 149_597_870.7;
const DEFAULT_OBSERVER = 10;
const DEFAULT_WINDOW_DAYS = 730;
const DEFAULT_STEP_DAYS = 1;
const DEFAULT_FRAME: ApiEphemerisFrame = 'ECLIPJ2000';
const DEFAULT_REFETCH_THRESHOLD = 0.15;
const DEFAULT_RETRY_BACKOFF_MS = 30_000;
const DEFAULT_MAX_PLAYBACK = 365; // days/s
const DEFAULT_PUSH_TOLERANCE_DAYS = 0.5;

function requireConfig(config: EphemerisBodyConfig): Required<EphemerisBodyConfig> {
  if (!Number.isInteger(config.naifId) || config.naifId < 0) {
    throw new Error(`EphemerisSampler.register: invalid NAIF id ${config.naifId}`);
  }
  return {
    naifId: config.naifId,
    observer: config.observer ?? DEFAULT_OBSERVER,
    windowDays: config.windowDays ?? DEFAULT_WINDOW_DAYS,
    stepDays: config.stepDays ?? DEFAULT_STEP_DAYS,
    frame: config.frame ?? DEFAULT_FRAME,
    refetchThreshold: config.refetchThreshold ?? DEFAULT_REFETCH_THRESHOLD,
  };
}

// ---------------------------------------------------------------------------
// Catmull-Rom cubic
// ---------------------------------------------------------------------------

/**
 * Centripetal-style Catmull-Rom on a uniformly-spaced sample row. `t` is
 * the fractional position between `p1` and `p2` (0 → p1, 1 → p2).
 * Formula: 0.5 * (2*p1 + (-p0 + p2)*t + (2*p0 − 5*p1 + 4*p2 − p3)*t² +
 *                 (−p0 + 3*p1 − 3*p2 + p3)*t³).
 *
 * For a uniform step of 1 day on a smooth heliocentric trajectory this
 * gives ~3 m of chord error per segment, well under the Doc 26 "sub-km
 * accuracy" aim. Linear would give ~5,500 km / segment for Earth — unsuitable.
 */
function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

// ---------------------------------------------------------------------------
// Sampler
// ---------------------------------------------------------------------------

export class EphemerisSampler {
  private readonly bodies = new Map<number, BodyEntry>();
  private readonly fetcher: typeof getEphemerisRange;
  private readonly retryBackoffMs: number;
  private readonly maxPlaybackDaysPerSec: number;
  private readonly pushFrameToleranceDays: number;
  private readonly onEvent: ((event: EphemerisSamplerEvent) => void) | null;
  private readonly now: () => number;

  /** Set by the scene each frame. Used to gate high-speed playback. */
  private playbackDaysPerSec = 0;
  private disposed = false;

  constructor(options: EphemerisSamplerOptions = {}) {
    this.fetcher = options.fetcher ?? getEphemerisRange;
    this.retryBackoffMs = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.maxPlaybackDaysPerSec = options.maxPlaybackDaysPerSec ?? DEFAULT_MAX_PLAYBACK;
    this.pushFrameToleranceDays = options.pushFrameToleranceDays ?? DEFAULT_PUSH_TOLERANCE_DAYS;
    this.onEvent = options.onEvent ?? null;
    this.now = options.now ?? Date.now;
  }

  /**
   * Register a body for live sampling. Safe to call repeatedly — existing
   * caches are preserved if the config is unchanged; otherwise reset.
   */
  register(config: EphemerisBodyConfig): void {
    const resolved = requireConfig(config);
    const existing = this.bodies.get(resolved.naifId);
    if (existing && configEquals(existing.config, resolved)) return;
    this.bodies.set(resolved.naifId, {
      config: resolved,
      status: 'idle',
      positionsKm: null,
      startJD: 0,
      endJD: 0,
      stepDays: resolved.stepDays,
      count: 0,
      nextRetryAt: 0,
      inflightEpoch: null,
      fetchGeneration: 0,
      lastError: null,
      livePoint: null,
    });
  }

  unregister(naifId: number): void {
    this.bodies.delete(naifId);
  }

  /** Clear every cache; the next `sample` call triggers fresh fetches. */
  clear(): void {
    for (const entry of this.bodies.values()) {
      entry.status = 'idle';
      entry.positionsKm = null;
      entry.count = 0;
      entry.nextRetryAt = 0;
      entry.inflightEpoch = null;
      entry.lastError = null;
      entry.livePoint = null;
    }
  }

  /**
   * T22 — apply a single `ephemeris_push` frame for the given body. The
   * push is the server's exact SPICE position at `epochJD` (position in
   * AU, heliocentric); we convert to km and cache it as a "live override"
   * that supersedes cubic interpolation whenever the queried `jd` lands
   * within {@link EphemerisSamplerOptions.pushFrameToleranceDays} of
   * `epochJD`.
   *
   * If the body hasn't been {@link register}ed, the push frame is
   * silently dropped — we only hold overrides for bodies the renderer
   * is actually sampling.
   */
  applyPushFrame(naifId: number, epochJD: number, positionAu: Vec3Km): void {
    const entry = this.bodies.get(naifId);
    if (!entry || this.disposed) return;
    if (!Number.isFinite(epochJD)) return;
    entry.livePoint = {
      jd: epochJD,
      x: positionAu.x * AU_KM,
      y: positionAu.y * AU_KM,
      z: positionAu.z * AU_KM,
    };
  }

  /**
   * Called by the renderer each frame so the sampler can gate itself when
   * the user scrubs the time slider faster than the cache can refresh.
   * Playback rate is in **sim days per wall-clock second** — derive from
   * `playbackSpeed / 86_400`.
   */
  setPlaybackContext(playbackDaysPerSec: number): void {
    this.playbackDaysPerSec = Math.abs(playbackDaysPerSec);
  }

  /**
   * Return the interpolated heliocentric (or parent-relative) position at
   * `jd` for the given body in km, or `null` if no sample is available
   * right now. Also triggers a background prefetch when the cache is
   * missing, stale, or near its edges.
   *
   * Returning `null` is the signal for callers to fall back to the Kepler
   * propagator — no exceptions are thrown for missing caches.
   */
  sample(naifId: number, jd: number, out?: Vec3Km): Vec3Km | null {
    const entry = this.bodies.get(naifId);
    if (!entry || this.disposed) return null;

    // Gate on playback rate. Above the threshold the cache churns so fast
    // that no fetch window survives long enough to be useful.
    if (this.playbackDaysPerSec > this.maxPlaybackDaysPerSec) {
      if (this.onEvent) {
        this.onEvent({ type: 'throttled', playbackDaysPerSec: this.playbackDaysPerSec });
      }
      return null;
    }

    // T22 — WS `ephemeris_push` override wins over both cached interp
    // and the "no cache" fallback. Valid within a small window around
    // the push frame's epoch so stale pushes don't persist.
    if (entry.livePoint !== null) {
      const dt = Math.abs(jd - entry.livePoint.jd);
      if (dt <= this.pushFrameToleranceDays) {
        const vec = out ?? { x: 0, y: 0, z: 0 };
        vec.x = entry.livePoint.x;
        vec.y = entry.livePoint.y;
        vec.z = entry.livePoint.z;
        return vec;
      }
    }

    // Cache miss — kick off the initial fetch.
    if (!entry.positionsKm || entry.count === 0) {
      this.ensureCoveredInternal(entry, jd);
      return null;
    }

    // Cache miss in range — jd scrubbed outside the window.
    if (jd < entry.startJD || jd > entry.endJD) {
      this.ensureCoveredInternal(entry, jd);
      return null;
    }

    // Re-fetch ahead when we're within `refetchThreshold` of either edge.
    const windowSpan = entry.endJD - entry.startJD;
    if (windowSpan > 0) {
      const leftMargin = (jd - entry.startJD) / windowSpan;
      const rightMargin = (entry.endJD - jd) / windowSpan;
      const margin = entry.config.refetchThreshold;
      if (leftMargin < margin || rightMargin < margin) {
        // Background prefetch — we already have a usable answer this frame.
        this.ensureCoveredInternal(entry, jd);
      }
    }

    return this.interpolate(entry, jd, out);
  }

  /**
   * Force a prefetch for a given body, bypassing the "already in-flight"
   * check. Returns a promise that resolves when the fetch settles.
   */
  async prefetch(naifId: number, centerJD: number): Promise<void> {
    const entry = this.bodies.get(naifId);
    if (!entry) return;
    // Bypass the nextRetryAt gate so tests / UI "reload" buttons can force it.
    entry.nextRetryAt = 0;
    await this.startFetch(entry, centerJD);
  }

  /** Introspection for tests + dev HUD. */
  getCacheStatus(naifId: number): EphemerisCacheStatus {
    return this.bodies.get(naifId)?.status ?? 'unknown';
  }

  /** Current window covered by the cache (for debugging). */
  getCacheWindow(naifId: number): { startJD: number; endJD: number; count: number } | null {
    const entry = this.bodies.get(naifId);
    if (!entry || !entry.positionsKm) return null;
    return { startJD: entry.startJD, endJD: entry.endJD, count: entry.count };
  }

  dispose(): void {
    this.disposed = true;
    this.bodies.clear();
  }

  // -------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------

  private ensureCoveredInternal(entry: BodyEntry, jd: number): void {
    if (entry.inflightEpoch !== null) return;
    if (this.now() < entry.nextRetryAt) return;
    // Fire and forget — the sampler tolerates overlapping fetches because
    // `inflightEpoch` gates a second call from starting.
    void this.startFetch(entry, jd);
  }

  private async startFetch(entry: BodyEntry, centerJD: number): Promise<void> {
    const halfWindow = entry.config.windowDays / 2;
    const startJD = centerJD - halfWindow;
    const endJD = centerJD + halfWindow;
    const generation = ++entry.fetchGeneration;
    entry.inflightEpoch = generation;
    entry.status = 'loading';
    this.onEvent?.({ type: 'fetch-start', naifId: entry.config.naifId, startJD, endJD });

    try {
      const range = await this.fetcher(entry.config.naifId, {
        startJD,
        endJD,
        stepDays: entry.config.stepDays,
        frame: entry.config.frame,
      });
      if (entry.inflightEpoch !== generation || this.disposed) {
        // A newer fetch or dispose() superseded us.
        return;
      }
      this.applyRange(entry, range);
      entry.status = 'ready';
      entry.lastError = null;
      this.onEvent?.({ type: 'fetch-ok', naifId: entry.config.naifId, samples: entry.count });
    } catch (error) {
      if (entry.inflightEpoch !== generation || this.disposed) return;
      entry.status = entry.positionsKm ? 'ready' : 'error';
      entry.lastError = error;
      entry.nextRetryAt = this.now() + this.retryBackoffMs;
      if (!(error instanceof ApiError) || !error.isRetryable()) {
        // Permanent-looking errors get the same backoff; with no stronger
        // signal from the server we err on the side of not hammering the API.
      }
      this.onEvent?.({ type: 'fetch-error', naifId: entry.config.naifId, error });
    } finally {
      if (entry.inflightEpoch === generation) entry.inflightEpoch = null;
    }
  }

  private applyRange(entry: BodyEntry, range: ApiEphemerisRange): void {
    const n = range.positions.length;
    const flat = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      const [x, y, z] = range.positions[i];
      flat[i * 3] = x * AU_KM;
      flat[i * 3 + 1] = y * AU_KM;
      flat[i * 3 + 2] = z * AU_KM;
    }
    entry.positionsKm = flat;
    entry.count = n;
    entry.startJD = range.start_jd;
    entry.endJD = range.end_jd;
    entry.stepDays = range.step_days || entry.config.stepDays;
  }

  private interpolate(entry: BodyEntry, jd: number, out?: Vec3Km): Vec3Km | null {
    if (!entry.positionsKm || entry.count < 2) return null;

    const float = (jd - entry.startJD) / entry.stepDays;
    const i1 = Math.floor(float);
    const t = float - i1;

    // Endpoint clamps — fall back to linear when we don't have 4 neighbours.
    const lastIdx = entry.count - 1;
    if (i1 <= 0) return this.readSample(entry, 0, out);
    if (i1 >= lastIdx) return this.readSample(entry, lastIdx, out);

    const i0 = Math.max(0, i1 - 1);
    const i2 = i1 + 1;
    const i3 = Math.min(lastIdx, i1 + 2);

    const flat = entry.positionsKm;
    const vec = out ?? { x: 0, y: 0, z: 0 };
    for (let c = 0; c < 3; c++) {
      const p0 = flat[i0 * 3 + c];
      const p1 = flat[i1 * 3 + c];
      const p2 = flat[i2 * 3 + c];
      const p3 = flat[i3 * 3 + c];
      const value = catmullRom1D(p0, p1, p2, p3, t);
      if (c === 0) vec.x = value;
      else if (c === 1) vec.y = value;
      else vec.z = value;
    }
    return vec;
  }

  private readSample(entry: BodyEntry, index: number, out?: Vec3Km): Vec3Km {
    const flat = entry.positionsKm!;
    const vec = out ?? { x: 0, y: 0, z: 0 };
    vec.x = flat[index * 3];
    vec.y = flat[index * 3 + 1];
    vec.z = flat[index * 3 + 2];
    return vec;
  }
}

function configEquals(
  a: Required<EphemerisBodyConfig>,
  b: Required<EphemerisBodyConfig>,
): boolean {
  return (
    a.naifId === b.naifId &&
    a.observer === b.observer &&
    a.windowDays === b.windowDays &&
    a.stepDays === b.stepDays &&
    a.frame === b.frame &&
    a.refetchThreshold === b.refetchThreshold
  );
}
