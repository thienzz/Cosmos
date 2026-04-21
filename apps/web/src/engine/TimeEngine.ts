import {
  EphemerisPushDispatcher,
  sendTimeUpdate,
  type EphemerisPushMessage,
  type WebSocketLike,
} from '@/api/ephemeris';
import { useTimeStore } from '@/stores/timeStore';

/**
 * Simulation clock.
 *
 * Doc 27 §5.3 + §6.4: the engine owns `epochJD` and writes it to the hot
 * Zustand store every frame; React reads via throttled subscriptions.
 *
 * Time semantics: `playbackSpeed` is *simulated seconds per real second*
 *   1 = real-time
 *   60 = 1 sim minute / real second
 *   86_400 = 1 sim day / real second
 *   1e5 = 100,000× (TASKS.md T11 upper bound)
 *
 * Doc 26 §14.2.2: when epoch crosses a configurable threshold the engine
 * sends a `time_update` WebSocket message so the backend can push the
 * next ephemeris batch (Doc 26 §14.3.2).
 */

export interface TimeEngineOptions {
  /** Minimum sim-day delta between successive `time_update` sends. */
  minSimDaysBetweenPushes?: number;
  /** Minimum real-time ms between successive `time_update` sends. */
  minRealMsBetweenPushes?: number;
  /** Bodies the engine will ask the backend to push ephemeris for. */
  trackedNaifIds?: number[];
}

const DEFAULTS: Required<TimeEngineOptions> = {
  minSimDaysBetweenPushes: 0.1,
  minRealMsBetweenPushes: 100,
  trackedNaifIds: [199, 299, 399, 499, 599, 699, 799, 899], // Mercury … Neptune
};

export class TimeEngine {
  readonly ephemerisPushDispatcher = new EphemerisPushDispatcher();

  private readonly options: Required<TimeEngineOptions>;
  private wsClient: WebSocketLike | null = null;

  private lastPushEpoch: number;
  private lastPushRealMs: number;

  constructor(options: TimeEngineOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
    this.lastPushEpoch = useTimeStore.getState().epochJD;
    this.lastPushRealMs = performance.now();
  }

  /**
   * Advance the simulation clock by `deltaRealMs` of wall-clock time.
   * Store clamps to SPICE kernel bounds (Doc 27 §5.3), so the caller
   * doesn't need to.
   */
  update(deltaRealMs: number): void {
    if (!Number.isFinite(deltaRealMs) || deltaRealMs <= 0) return;
    const state = useTimeStore.getState();
    if (!state.isPlaying) return;

    const deltaSimSec = (deltaRealMs / 1000) * state.playbackSpeed;
    const deltaSimDays = deltaSimSec / 86_400;
    if (deltaSimDays === 0) return;

    state.setEpoch(state.epochJD + deltaSimDays);

    this.maybePushTimeUpdate();
  }

  /** Attach a WebSocket-like transport for sending `time_update`. */
  attachWebSocket(ws: WebSocketLike | null): void {
    this.wsClient = ws;
  }

  /** Current simulated epoch (JD) from the store — convenience accessor. */
  getEpochJulianDate(): number {
    return useTimeStore.getState().epochJD;
  }

  /** Route a raw WS frame through the ephemeris-push dispatcher. */
  handleWebSocketMessage(raw: string): EphemerisPushMessage | null {
    return this.ephemerisPushDispatcher.handleRawMessage(raw);
  }

  private maybePushTimeUpdate(): void {
    if (!this.wsClient) return;
    const { epochJD, playbackSpeed } = useTimeStore.getState();
    const dEpoch = Math.abs(epochJD - this.lastPushEpoch);
    const nowMs = performance.now();
    if (dEpoch < this.options.minSimDaysBetweenPushes) return;
    if (nowMs - this.lastPushRealMs < this.options.minRealMsBetweenPushes) return;

    sendTimeUpdate(this.wsClient, {
      epochJD,
      playbackSpeed,
      bodiesRequested: this.options.trackedNaifIds,
    });
    this.lastPushEpoch = epochJD;
    this.lastPushRealMs = nowMs;
  }
}
