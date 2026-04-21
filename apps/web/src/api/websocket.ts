/**
 * WebSocket transport for real-time Cosmos Explorer events (Doc 26 §14).
 *
 * Owns the single `wss://…/v1/ws` connection that handles:
 *   - outbound `time_update`, `viewport_update`, `subscribe_export`, `ping`
 *   - inbound `connected`, `ephemeris_push`, `tile_priority`,
 *     `data_version_update`, `export_progress`, `pong`
 *
 * Responsibilities not owned by this module:
 *   - deciding WHAT time/viewport the server needs — `TimeEngine`
 *     and `SceneManager` build the messages and push them through
 *     `sendTimeUpdate` / `sendViewportUpdate`.
 *   - reacting to inbound frames — listeners register via
 *     `onEphemerisPush`, `onDataVersionUpdate`, etc., and own the
 *     side-effects (sampler updates, cache busts, UI toasts).
 *
 * The class is a thin event-bus. It does NOT touch stores directly —
 * the SceneManager wires subscribers so tests can drive the bus in
 * isolation.
 */

import { clearEtagCache } from './client';
import { apiConfig } from './config';
import { clearEntityCache } from './entities';
import { clearAutocompleteCache } from './search';

// ---------------------------------------------------------------------------
// Message shapes (Doc 26 §14.3)
// ---------------------------------------------------------------------------

export interface WsConnectedMessage {
  type: 'connected';
  session_id: string;
  tier: 'anonymous' | 'registered' | 'research' | 'internal';
  server_time: string;
}

export interface WsTilePriorityMessage {
  type: 'tile_priority';
  tiles: Array<{ url: string; priority: number }>;
}

export interface WsEphemerisPushBody {
  naif_id: number;
  x: number;
  y: number;
  z: number;
}

export interface WsEphemerisPushMessage {
  type: 'ephemeris_push';
  epoch_jd: number;
  bodies: WsEphemerisPushBody[];
}

export interface WsExportProgressMessage {
  type: 'export_progress';
  job_id: string;
  status: string;
  progress_percent: number;
  frames_rendered?: number;
  frames_total?: number;
  eta_seconds?: number;
}

export interface WsDataVersionUpdateMessage {
  type: 'data_version_update';
  old_version: string;
  new_version: string;
  message?: string;
  manifest_url?: string;
}

export interface WsPongMessage {
  type: 'pong';
  server_time: string;
}

export type CosmosWsMessage =
  | WsConnectedMessage
  | WsTilePriorityMessage
  | WsEphemerisPushMessage
  | WsExportProgressMessage
  | WsDataVersionUpdateMessage
  | WsPongMessage;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subset of the WHATWG `WebSocket` surface we actually use — lets tests
 * swap in a fake without extending `EventTarget`.
 */
export interface WebSocketAdapter {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: { code: number; reason: string; wasClean: boolean }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: string | ArrayBuffer }) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketAdapter;

export interface CosmosWebSocketOptions {
  /** Override the `wss://…/v1/ws` URL (defaults to `apiConfig.baseUrl + '/ws'`). */
  url?: string;
  /** Session token appended as `?session=…` per Doc 26 §14.1. */
  sessionToken?: string;
  /** Custom WS ctor for tests / environments that don't have `window.WebSocket`. */
  webSocketFactory?: WebSocketFactory;
  /** Heartbeat interval in ms. Doc 26 §14.4 mandates ≤ 30 s. Default 30_000. */
  heartbeatMs?: number;
  /** Initial reconnect delay. Default 1 s (Doc 27 §15.3). */
  reconnectBaseMs?: number;
  /** Cap for the exponential backoff. Default 30 s. */
  reconnectMaxMs?: number;
  /**
   * Skip the auto-reconnect path entirely. Tests + deliberate shutdowns
   * set this via {@link CosmosWebSocket.disconnect}.
   */
  autoReconnect?: boolean;
  /** Time source override (tests). Default `Date.now`. */
  now?: () => number;
  /** Timer override (tests that use fake timers but want real setInterval). */
  setInterval?: typeof globalThis.setInterval;
  /** Timer override — ditto. */
  setTimeout?: typeof globalThis.setTimeout;
  clearInterval?: typeof globalThis.clearInterval;
  clearTimeout?: typeof globalThis.clearTimeout;
}

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export interface CosmosWsListeners {
  onConnected?: (msg: WsConnectedMessage) => void;
  onEphemerisPush?: (msg: WsEphemerisPushMessage) => void;
  onTilePriority?: (msg: WsTilePriorityMessage) => void;
  onDataVersionUpdate?: (msg: WsDataVersionUpdateMessage) => void;
  onExportProgress?: (msg: WsExportProgressMessage) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: unknown) => void;
}

// ---------------------------------------------------------------------------
// URL derivation
// ---------------------------------------------------------------------------

/**
 * Turn an HTTP(S) base URL into the matching WS(S) URL. Relative bases
 * (dev proxy `/v1`) pick up the current page's scheme + host so a dev
 * that hits `http://localhost:5173` talks to `ws://localhost:5173/v1/ws`.
 */
export function deriveWebSocketUrl(httpBaseUrl: string): string {
  if (httpBaseUrl.startsWith('/')) {
    const loc = typeof window !== 'undefined' ? window.location : null;
    const proto = loc && loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc?.host ?? 'localhost';
    return `${proto}//${host}${httpBaseUrl.replace(/\/+$/, '')}/ws`;
  }
  const httpPrefix = /^https:/.test(httpBaseUrl) ? 'wss:' : 'ws:';
  return httpBaseUrl.replace(/^https?:/, httpPrefix).replace(/\/+$/, '') + '/ws';
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

const READY_STATE_OPEN = 1;

export class CosmosWebSocket {
  private readonly url: string;
  private readonly sessionToken: string | null;
  private readonly factory: WebSocketFactory;
  private readonly heartbeatMs: number;
  private readonly reconnectBaseMs: number;
  private readonly reconnectMaxMs: number;
  private readonly _setInterval: typeof globalThis.setInterval;
  private readonly _setTimeout: typeof globalThis.setTimeout;
  private readonly _clearInterval: typeof globalThis.clearInterval;
  private readonly _clearTimeout: typeof globalThis.clearTimeout;

  private listeners: CosmosWsListeners = {};
  private socket: WebSocketAdapter | null = null;
  private state: ConnectionState = 'idle';
  private autoReconnect: boolean;
  private reconnectAttempts = 0;
  private heartbeatHandle: ReturnType<typeof setInterval> | null = null;
  private reconnectHandle: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(options: CosmosWebSocketOptions = {}) {
    const baseUrl = options.url ?? deriveWebSocketUrl(apiConfig.baseUrl);
    this.sessionToken = options.sessionToken ?? null;
    this.url = buildConnectUrl(baseUrl, this.sessionToken, apiConfig.apiKey);

    this.factory =
      options.webSocketFactory ??
      ((url: string) => {
        const WSCtor = (globalThis as { WebSocket?: new (url: string) => WebSocketAdapter }).WebSocket;
        if (!WSCtor) {
          throw new Error('globalThis.WebSocket unavailable — supply webSocketFactory');
        }
        return new WSCtor(url);
      });

    this.heartbeatMs = options.heartbeatMs ?? 30_000;
    this.reconnectBaseMs = options.reconnectBaseMs ?? 1_000;
    this.reconnectMaxMs = options.reconnectMaxMs ?? 30_000;
    this._setInterval = options.setInterval ?? globalThis.setInterval.bind(globalThis);
    this._setTimeout = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this._clearInterval = options.clearInterval ?? globalThis.clearInterval.bind(globalThis);
    this._clearTimeout = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
    this.autoReconnect = options.autoReconnect ?? true;
  }

  /** Attach listeners. Merges with existing — pass `null` to clear. */
  setListeners(listeners: CosmosWsListeners | null): void {
    this.listeners = listeners ?? {};
  }

  /** Current connection state snapshot. */
  getState(): ConnectionState {
    return this.state;
  }

  /** True while the underlying socket is in `OPEN` state. */
  isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === READY_STATE_OPEN;
  }

  /**
   * Kick off the connection. Safe to call repeatedly — a second call
   * while already connecting / open is a no-op. Manual reconnects should
   * go through `disconnect()` + `connect()` so pending reconnect timers
   * don't race.
   */
  connect(): void {
    if (this.disposed) return;
    if (this.state === 'connecting' || this.state === 'open') return;
    this.autoReconnect = true;
    this.openSocket();
  }

  /**
   * Close the socket and stop reconnecting. After `disconnect()` the
   * instance is still usable — call `connect()` to start again.
   */
  disconnect(code = 1000, reason = 'client disconnect'): void {
    this.autoReconnect = false;
    this.clearReconnect();
    this.stopHeartbeat();
    if (this.socket && this.state !== 'closed') {
      try {
        this.socket.close(code, reason);
      } catch {
        // Browsers throw if close() fires during CONNECTING in some edge cases — ignore.
      }
    }
    this.socket = null;
    this.setState('closed');
  }

  /** Release all handles; further `connect()` calls become no-ops. */
  dispose(): void {
    this.disposed = true;
    this.disconnect(1000, 'dispose');
  }

  /** Send a framed payload if the socket is open; drops otherwise. */
  send(payload: Record<string, unknown>): boolean {
    if (!this.isOpen() || this.socket === null) return false;
    try {
      this.socket.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      this.listeners.onError?.(error);
      return false;
    }
  }

  sendTimeUpdate(epochJD: number, playbackSpeed: number, bodies: readonly number[]): boolean {
    return this.send({
      type: 'time_update',
      epoch_jd: epochJD,
      playback_speed: playbackSpeed,
      bodies_requested: [...bodies],
    });
  }

  sendViewportUpdate(frustum: {
    position: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    fovDeg: number;
    aspect: number;
    near: number;
    far: number;
    lodBias?: number;
  }): boolean {
    return this.send({
      type: 'viewport_update',
      frustum: {
        position: frustum.position,
        direction: frustum.direction,
        fov_deg: frustum.fovDeg,
        aspect: frustum.aspect,
        near: frustum.near,
        far: frustum.far,
      },
      lod_bias: frustum.lodBias ?? 0,
    });
  }

  sendSubscribeExport(jobId: string): boolean {
    return this.send({ type: 'subscribe_export', job_id: jobId });
  }

  // -------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------

  private openSocket(): void {
    this.setState('connecting');
    let socket: WebSocketAdapter;
    try {
      socket = this.factory(this.url);
    } catch (error) {
      this.listeners.onError?.(error);
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.clearReconnect();
      this.setState('open');
      this.startHeartbeat();
    };
    socket.onmessage = (ev) => this.dispatch(ev.data);
    socket.onerror = (err) => this.listeners.onError?.(err);
    socket.onclose = (ev) => this.handleClose(ev);
  }

  private handleClose(ev: { code: number; reason: string; wasClean: boolean }): void {
    this.stopHeartbeat();
    if (this.disposed) {
      this.setState('closed');
      this.socket = null;
      return;
    }
    this.socket = null;
    this.setState('closed');
    if (!this.autoReconnect) return;
    // Normal close (1000) from the server + autoReconnect still reconnects —
    // Doc 27 §15.3 treats WebSocket drops uniformly. A client-side
    // `disconnect()` flips `autoReconnect` off first, so we don't race.
    if (ev.code === 1000 && ev.reason === 'dispose') return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.autoReconnect || this.disposed) return;
    if (this.reconnectHandle !== null) return;
    const delay = Math.min(
      this.reconnectMaxMs,
      this.reconnectBaseMs * Math.pow(2, this.reconnectAttempts),
    );
    this.reconnectAttempts += 1;
    this.reconnectHandle = this._setTimeout(() => {
      this.reconnectHandle = null;
      this.openSocket();
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectHandle !== null) {
      this._clearTimeout(this.reconnectHandle);
      this.reconnectHandle = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatHandle = this._setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatHandle !== null) {
      this._clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = null;
    }
  }

  private setState(next: ConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    this.listeners.onStateChange?.(next);
  }

  private dispatch(raw: string | ArrayBuffer): void {
    if (typeof raw !== 'string') return; // Binary frames aren't part of Doc 26 §14.
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // Malformed JSON — drop silently per dispatcher convention.
    }
    if (!isObject(parsed)) return;
    const type = (parsed as { type?: unknown }).type;
    switch (type) {
      case 'connected':
        if (isConnectedMessage(parsed)) this.listeners.onConnected?.(parsed);
        break;
      case 'ephemeris_push':
        if (isEphemerisPushMessage(parsed)) this.listeners.onEphemerisPush?.(parsed);
        break;
      case 'tile_priority':
        if (isTilePriorityMessage(parsed)) this.listeners.onTilePriority?.(parsed);
        break;
      case 'data_version_update':
        if (isDataVersionUpdateMessage(parsed)) {
          // T22 — bust every HTTP cache keyed by entity identity. The
          // WebSocket path is the canonical invalidation signal (Doc
          // 27 §7.2), so this is where we flush both the entity LRU
          // and the ETag cache + the autocomplete LRU.
          clearEntityCache(); // already clears the ETag cache as a side effect
          clearAutocompleteCache();
          clearEtagCache(); // belt-and-braces: an entity-only cache clear
                            // would leave search/solar-system ETags stale.
          this.listeners.onDataVersionUpdate?.(parsed);
        }
        break;
      case 'export_progress':
        if (isExportProgressMessage(parsed)) this.listeners.onExportProgress?.(parsed);
        break;
      case 'pong':
        // No-op — reception itself proves the server is alive; we don't
        // track latency yet (T35 observability will add that).
        break;
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildConnectUrl(base: string, session: string | null, apiKey: string | null): string {
  const params = new URLSearchParams();
  if (session) params.set('session', session);
  if (apiKey) params.set('api_key', apiKey);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isConnectedMessage(value: unknown): value is WsConnectedMessage {
  if (!isObject(value)) return false;
  return (
    value.type === 'connected' &&
    typeof value.session_id === 'string' &&
    typeof value.tier === 'string' &&
    typeof value.server_time === 'string'
  );
}

function isEphemerisPushMessage(value: unknown): value is WsEphemerisPushMessage {
  if (!isObject(value)) return false;
  if (value.type !== 'ephemeris_push') return false;
  if (typeof value.epoch_jd !== 'number') return false;
  if (!Array.isArray(value.bodies)) return false;
  return value.bodies.every((body) => {
    if (!isObject(body)) return false;
    return (
      typeof body.naif_id === 'number' &&
      typeof body.x === 'number' &&
      typeof body.y === 'number' &&
      typeof body.z === 'number'
    );
  });
}

function isTilePriorityMessage(value: unknown): value is WsTilePriorityMessage {
  if (!isObject(value)) return false;
  if (value.type !== 'tile_priority') return false;
  if (!Array.isArray(value.tiles)) return false;
  return value.tiles.every((tile) => {
    if (!isObject(tile)) return false;
    return typeof tile.url === 'string' && typeof tile.priority === 'number';
  });
}

function isDataVersionUpdateMessage(value: unknown): value is WsDataVersionUpdateMessage {
  if (!isObject(value)) return false;
  return (
    value.type === 'data_version_update' &&
    typeof value.old_version === 'string' &&
    typeof value.new_version === 'string'
  );
}

function isExportProgressMessage(value: unknown): value is WsExportProgressMessage {
  if (!isObject(value)) return false;
  return (
    value.type === 'export_progress' &&
    typeof value.job_id === 'string' &&
    typeof value.status === 'string' &&
    typeof value.progress_percent === 'number'
  );
}
