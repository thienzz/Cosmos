/**
 * Ephemeris API client helpers (Doc 26 §8, §14.3.2).
 *
 *   - T11 scope: request shaping + validation, WebSocket push parsing.
 *   - T18 scope: HTTP fetchers (`getEphemeris`, `getEphemerisRange`,
 *     `postEphemerisBatch`) on top of the shared {@link apiGet} / {@link apiPost}
 *     transport.
 */

import { apiGet, apiPost, ApiError } from './client';
import type { ApiEphemerisFrame, ApiEphemerisPoint, ApiEphemerisRange } from './types';

// ---------------------------------------------------------------------------
// POST /ephemeris/batch — Doc 26 §8.2
// ---------------------------------------------------------------------------

export interface BatchEphemerisRequest {
  naif_ids: number[];
  epochs: number[];
  frame?: 'ECLIPJ2000' | 'J2000' | 'GALACTIC';
  observer?: number;
}

export interface BatchEphemerisResult {
  naif_id: number;
  epoch_jd: number;
  x: number;
  y: number;
  z: number;
}

export interface BatchEphemerisResponse {
  results: BatchEphemerisResult[];
  count: number;
}

/** Doc 26 §8.2 constraints. */
export const BATCH_EPHEMERIS_LIMITS = Object.freeze({
  maxBodies: 50,
  maxEpochs: 1000,
  maxTotalComputations: 10_000,
});

export class BatchEphemerisError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'TOO_MANY_BODIES'
      | 'TOO_MANY_EPOCHS'
      | 'TOO_MANY_COMPUTATIONS'
      | 'EMPTY_REQUEST'
      | 'INVALID_NAIF_ID'
      | 'INVALID_EPOCH',
  ) {
    super(message);
    this.name = 'BatchEphemerisError';
  }
}

/**
 * Validate + normalise a batch ephemeris request. Call from the store / UI
 * layer before POST so we don't waste a network round-trip on a request the
 * server would reject anyway.
 */
export function validateBatchEphemerisRequest(req: BatchEphemerisRequest): BatchEphemerisRequest {
  if (req.naif_ids.length === 0 || req.epochs.length === 0) {
    throw new BatchEphemerisError(
      'Batch request requires ≥1 NAIF id and ≥1 epoch',
      'EMPTY_REQUEST',
    );
  }
  if (req.naif_ids.length > BATCH_EPHEMERIS_LIMITS.maxBodies) {
    throw new BatchEphemerisError(
      `Max ${BATCH_EPHEMERIS_LIMITS.maxBodies} NAIF ids per request (got ${req.naif_ids.length})`,
      'TOO_MANY_BODIES',
    );
  }
  if (req.epochs.length > BATCH_EPHEMERIS_LIMITS.maxEpochs) {
    throw new BatchEphemerisError(
      `Max ${BATCH_EPHEMERIS_LIMITS.maxEpochs} epochs per request (got ${req.epochs.length})`,
      'TOO_MANY_EPOCHS',
    );
  }
  const total = req.naif_ids.length * req.epochs.length;
  if (total > BATCH_EPHEMERIS_LIMITS.maxTotalComputations) {
    throw new BatchEphemerisError(
      `Max ${BATCH_EPHEMERIS_LIMITS.maxTotalComputations} total computations (bodies × epochs = ${total})`,
      'TOO_MANY_COMPUTATIONS',
    );
  }
  for (const id of req.naif_ids) {
    if (!Number.isInteger(id) || id < 0) {
      throw new BatchEphemerisError(`Invalid NAIF id ${id}`, 'INVALID_NAIF_ID');
    }
  }
  for (const jd of req.epochs) {
    if (!Number.isFinite(jd)) {
      throw new BatchEphemerisError(`Invalid epoch JD ${jd}`, 'INVALID_EPOCH');
    }
  }
  return {
    naif_ids: req.naif_ids,
    epochs: req.epochs,
    frame: req.frame ?? 'ECLIPJ2000',
    observer: req.observer ?? 10,
  };
}

// ---------------------------------------------------------------------------
// HTTP fetchers — T18 (Doc 26 §8.1 / §8.3)
// ---------------------------------------------------------------------------

export interface GetEphemerisOptions {
  /** Julian Date (TDB). Valid range 2287184.5 – 2688976.5 (1550–2650 CE). */
  epochJD: number;
  /** Defaults to `ECLIPJ2000`. */
  frame?: ApiEphemerisFrame;
  /** Observer NAIF id; defaults to 10 (Sun). */
  observer?: number;
  signal?: AbortSignal;
}

const MIN_EPOCH_JD = 2_287_184.5; // 1550-01-01
const MAX_EPOCH_JD = 2_688_976.5; // 2650-12-31

function assertEpoch(jd: number): void {
  if (!Number.isFinite(jd) || jd < MIN_EPOCH_JD || jd > MAX_EPOCH_JD) {
    throw new ApiError(
      {
        code: 'EPOCH_OUT_OF_RANGE',
        message: `epoch JD ${jd} outside [${MIN_EPOCH_JD}, ${MAX_EPOCH_JD}]`,
        status: 400,
        request_id: 'client',
      },
      400,
    );
  }
}

function assertNaifId(id: number): void {
  if (!Number.isInteger(id) || id < 0) {
    throw new ApiError(
      {
        code: 'INVALID_NAIF_ID',
        message: `NAIF id must be a non-negative integer (got ${id})`,
        status: 400,
        request_id: 'client',
      },
      400,
    );
  }
}

/** `GET /ephemeris/{naifId}` — single position + velocity at one epoch. */
export async function getEphemeris(
  naifId: number,
  opts: GetEphemerisOptions,
): Promise<ApiEphemerisPoint> {
  assertNaifId(naifId);
  assertEpoch(opts.epochJD);
  return apiGet<ApiEphemerisPoint>(`/ephemeris/${naifId}`, {
    query: {
      epoch: opts.epochJD,
      frame: opts.frame,
      observer: opts.observer,
    },
    signal: opts.signal,
    // Ephemeris results are epoch-specific; ETag revalidation adds latency
    // without helping (epochs rarely repeat), so skip the cache layer.
    bypassCache: true,
  });
}

export interface GetEphemerisRangeOptions {
  startJD: number;
  endJD: number;
  /** Step in days; min 0.01, max 365.25. Default 1.0. */
  stepDays?: number;
  frame?: ApiEphemerisFrame;
  signal?: AbortSignal;
}

/** `GET /ephemeris/range/{naifId}` — sampled trajectory. */
export async function getEphemerisRange(
  naifId: number,
  opts: GetEphemerisRangeOptions,
): Promise<ApiEphemerisRange> {
  assertNaifId(naifId);
  assertEpoch(opts.startJD);
  assertEpoch(opts.endJD);
  return apiGet<ApiEphemerisRange>(`/ephemeris/range/${naifId}`, {
    query: {
      start: opts.startJD,
      end: opts.endJD,
      step: opts.stepDays,
      frame: opts.frame,
    },
    signal: opts.signal,
    bypassCache: true,
  });
}

/**
 * `POST /ephemeris/batch` — up to 10k computations in one round-trip.
 *
 * Validates locally first via {@link validateBatchEphemerisRequest} so we
 * never waste a hop on something the server would reject. Those validation
 * errors throw {@link BatchEphemerisError}; transport / server errors throw
 * {@link ApiError}.
 */
export async function postEphemerisBatch(
  req: BatchEphemerisRequest,
  signal?: AbortSignal,
): Promise<BatchEphemerisResponse> {
  const normalised = validateBatchEphemerisRequest(req);
  return apiPost<BatchEphemerisResponse>('/ephemeris/batch', normalised, { signal });
}

// ---------------------------------------------------------------------------
// WebSocket: ephemeris_push handler + time_update sender (Doc 26 §14)
// ---------------------------------------------------------------------------

export interface EphemerisPushBody {
  naif_id: number;
  x: number;
  y: number;
  z: number;
}

export interface EphemerisPushMessage {
  type: 'ephemeris_push';
  epoch_jd: number;
  bodies: EphemerisPushBody[];
}

export interface TimeUpdateMessage {
  type: 'time_update';
  epoch_jd: number;
  playback_speed: number;
  bodies_requested: number[];
}

export function isEphemerisPushMessage(value: unknown): value is EphemerisPushMessage {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.type !== 'ephemeris_push') return false;
  if (typeof v.epoch_jd !== 'number') return false;
  if (!Array.isArray(v.bodies)) return false;
  return v.bodies.every((body) => {
    if (body === null || typeof body !== 'object') return false;
    const b = body as Record<string, unknown>;
    return (
      typeof b.naif_id === 'number' &&
      typeof b.x === 'number' &&
      typeof b.y === 'number' &&
      typeof b.z === 'number'
    );
  });
}

/** Minimal WebSocket-ish interface so we can stub the transport in tests. */
export interface WebSocketLike {
  send(data: string): void;
}

export function sendTimeUpdate(
  ws: WebSocketLike,
  msg: { epochJD: number; playbackSpeed: number; bodiesRequested: number[] },
): void {
  const payload: TimeUpdateMessage = {
    type: 'time_update',
    epoch_jd: msg.epochJD,
    playback_speed: msg.playbackSpeed,
    bodies_requested: msg.bodiesRequested,
  };
  ws.send(JSON.stringify(payload));
}

type EphemerisPushListener = (msg: EphemerisPushMessage) => void;

/**
 * Parses raw WebSocket frames and fans `ephemeris_push` messages out to
 * registered listeners. Non-matching messages (other `type` values,
 * malformed JSON) are dropped silently — each message class owns its own
 * handler.
 */
export class EphemerisPushDispatcher {
  private readonly listeners = new Set<EphemerisPushListener>();

  subscribe(listener: EphemerisPushListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  handleRawMessage(raw: string): EphemerisPushMessage | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!isEphemerisPushMessage(parsed)) return null;
    for (const listener of this.listeners) listener(parsed);
    return parsed;
  }

  listenerCount(): number {
    return this.listeners.size;
  }
}
