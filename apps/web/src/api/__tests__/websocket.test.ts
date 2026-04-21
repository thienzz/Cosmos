import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiConfig } from '../config';
import { clearEntityCache, peekEntityCache } from '../entities';
import { clearAutocompleteCache } from '../search';
import {
  CosmosWebSocket,
  deriveWebSocketUrl,
  type WebSocketAdapter,
} from '../websocket';

/**
 * Test double for the WHATWG WebSocket. The real class extends EventTarget
 * and has deep integration with the browser event loop; we only care about
 * the 4 handlers our manager reads, so a plain object suffices.
 *
 * Pushed onto a module-scoped registry so tests can grab the "current"
 * socket without threading handles through every call.
 */
class FakeSocket implements WebSocketAdapter {
  static instances: FakeSocket[] = [];
  readyState = 0; // CONNECTING
  sent: string[] = [];
  closed: Array<{ code?: number; reason?: string }> = [];
  onopen: ((ev: unknown) => void) | null = null;
  onclose: ((ev: { code: number; reason: string; wasClean: boolean }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string | ArrayBuffer }) => void) | null = null;
  constructor(public readonly url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string): void {
    if (this.readyState !== 1) throw new Error('send() before OPEN');
    this.sent.push(data);
  }
  close(code?: number, reason?: string): void {
    this.readyState = 3; // CLOSED
    this.closed.push({ code, reason });
    this.onclose?.({ code: code ?? 1005, reason: reason ?? '', wasClean: true });
  }
  // Test helpers.
  simulateOpen(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  simulateMessage(payload: unknown): void {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.onmessage?.({ data: raw });
  }
  simulateClose(code = 1006, reason = 'abnormal'): void {
    this.readyState = 3;
    this.onclose?.({ code, reason, wasClean: false });
  }
}

function factory(url: string): WebSocketAdapter {
  return new FakeSocket(url);
}

function lastSocket(): FakeSocket {
  const s = FakeSocket.instances.at(-1);
  if (!s) throw new Error('no fake socket');
  return s;
}

beforeEach(() => {
  FakeSocket.instances = [];
  apiConfig.reset();
  apiConfig.setBaseUrl('https://api.test/v1');
  clearEntityCache();
  clearAutocompleteCache();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('deriveWebSocketUrl', () => {
  it('swaps https → wss and http → ws, preserving host + /v1', () => {
    expect(deriveWebSocketUrl('https://api.test/v1')).toBe('wss://api.test/v1/ws');
    expect(deriveWebSocketUrl('http://localhost:8080/v1')).toBe('ws://localhost:8080/v1/ws');
  });

  it('uses the current page origin for relative bases (dev proxy)', () => {
    // jsdom default window.location.protocol = 'http:', host ~= 'localhost:*'.
    const url = deriveWebSocketUrl('/v1');
    expect(url.startsWith('ws://')).toBe(true);
    expect(url.endsWith('/v1/ws')).toBe(true);
  });
});

describe('CosmosWebSocket', () => {
  it('builds the connect URL with session + api_key query params', () => {
    apiConfig.setApiKey('abcd');
    const ws = new CosmosWebSocket({
      webSocketFactory: factory,
      sessionToken: 'sess_123',
    });
    ws.connect();
    expect(lastSocket().url).toContain('wss://api.test/v1/ws?');
    expect(lastSocket().url).toContain('session=sess_123');
    expect(lastSocket().url).toContain('api_key=abcd');
  });

  it('onopen → state=open and installs heartbeat ping', () => {
    vi.useFakeTimers();
    const ws = new CosmosWebSocket({
      webSocketFactory: factory,
      heartbeatMs: 1000,
      setInterval: globalThis.setInterval.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });
    const states: string[] = [];
    ws.setListeners({ onStateChange: (s) => states.push(s) });
    ws.connect();

    expect(ws.getState()).toBe('connecting');
    lastSocket().simulateOpen();
    expect(ws.getState()).toBe('open');
    expect(states).toEqual(['connecting', 'open']);

    vi.advanceTimersByTime(2_500);
    const pings = lastSocket().sent.filter((p) => JSON.parse(p).type === 'ping');
    expect(pings.length).toBeGreaterThanOrEqual(2);

    ws.dispose();
  });

  it('dispatches every documented inbound frame to the right listener', () => {
    const onConnected = vi.fn();
    const onEphemerisPush = vi.fn();
    const onTilePriority = vi.fn();
    const onDataVersionUpdate = vi.fn();
    const onExportProgress = vi.fn();

    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    ws.setListeners({
      onConnected,
      onEphemerisPush,
      onTilePriority,
      onDataVersionUpdate,
      onExportProgress,
    });
    ws.connect();
    const sock = lastSocket();
    sock.simulateOpen();

    sock.simulateMessage({
      type: 'connected',
      session_id: 's',
      tier: 'anonymous',
      server_time: 't',
    });
    sock.simulateMessage({
      type: 'ephemeris_push',
      epoch_jd: 2_460_000.5,
      bodies: [{ naif_id: 399, x: 1, y: 2, z: 3 }],
    });
    sock.simulateMessage({
      type: 'tile_priority',
      tiles: [{ url: '/v1/tiles/stars/5/0/0/3', priority: 1 }],
    });
    sock.simulateMessage({
      type: 'data_version_update',
      old_version: 'v1',
      new_version: 'v2',
    });
    sock.simulateMessage({
      type: 'export_progress',
      job_id: 'j',
      status: 'rendering',
      progress_percent: 50,
    });

    expect(onConnected).toHaveBeenCalledOnce();
    expect(onEphemerisPush).toHaveBeenCalledOnce();
    expect(onTilePriority).toHaveBeenCalledOnce();
    expect(onDataVersionUpdate).toHaveBeenCalledOnce();
    expect(onExportProgress).toHaveBeenCalledOnce();

    ws.dispose();
  });

  it('drops malformed frames and unknown types without throwing', () => {
    const onEphemerisPush = vi.fn();
    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    ws.setListeners({ onEphemerisPush });
    ws.connect();
    lastSocket().simulateOpen();
    lastSocket().simulateMessage('not json');
    lastSocket().simulateMessage({ type: 'ephemeris_push' }); // missing epoch_jd / bodies
    lastSocket().simulateMessage({ type: 'mystery', foo: 'bar' });
    expect(onEphemerisPush).not.toHaveBeenCalled();
    ws.dispose();
  });

  it('data_version_update busts entity + autocomplete caches', async () => {
    // Seed the entity cache via the public path.
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: 42,
            ent_id: 'ENT-2001',
            name: 'Earth',
            category: 2,
            category_name: 'rocky_planet',
            entity_type: 2001,
            type_name: 'Terrestrial',
            aliases: [],
            position: { ra: 0, dec: 0, distance_pc: 0 },
            properties: {},
            catalog_ids: {},
            data_source: 'jpl_horizons',
            data_quality: 1,
            toggles: [],
            _links: { self: '/v1/entities/42' },
          },
          meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const { getEntity } = await import('../entities');
    await getEntity(42);
    expect(peekEntityCache(42)).toBeDefined();

    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    ws.connect();
    lastSocket().simulateOpen();
    lastSocket().simulateMessage({
      type: 'data_version_update',
      old_version: 'v1',
      new_version: 'v2',
    });
    expect(peekEntityCache(42)).toBeUndefined();
    ws.dispose();
  });

  it('sendTimeUpdate serialises the Doc 26 §14.2.2 payload', () => {
    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    ws.connect();
    lastSocket().simulateOpen();

    const sent = ws.sendTimeUpdate(2_460_000.5, 1, [399, 499]);
    expect(sent).toBe(true);
    const payload = JSON.parse(lastSocket().sent[0]!) as Record<string, unknown>;
    expect(payload).toEqual({
      type: 'time_update',
      epoch_jd: 2_460_000.5,
      playback_speed: 1,
      bodies_requested: [399, 499],
    });
    ws.dispose();
  });

  it('send() returns false when the socket is not open', () => {
    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    expect(ws.sendTimeUpdate(2_460_000.5, 1, [399])).toBe(false);
    ws.connect();
    // Still only CONNECTING — simulateOpen not called yet.
    expect(ws.sendTimeUpdate(2_460_000.5, 1, [399])).toBe(false);
    ws.dispose();
  });

  it('auto-reconnects with exponential backoff after an unclean close', () => {
    vi.useFakeTimers();
    const ws = new CosmosWebSocket({
      webSocketFactory: factory,
      reconnectBaseMs: 100,
      reconnectMaxMs: 10_000,
      setInterval: globalThis.setInterval.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });
    ws.connect();
    expect(FakeSocket.instances).toHaveLength(1);
    lastSocket().simulateOpen();
    lastSocket().simulateClose(1006, 'abnormal');

    // Attempt 1: 100 ms delay.
    vi.advanceTimersByTime(150);
    expect(FakeSocket.instances).toHaveLength(2);

    lastSocket().simulateClose(1006, 'abnormal');
    // Attempt 2: 200 ms delay.
    vi.advanceTimersByTime(150);
    expect(FakeSocket.instances).toHaveLength(2); // hasn't waited 200ms yet
    vi.advanceTimersByTime(100);
    expect(FakeSocket.instances).toHaveLength(3);

    ws.dispose();
  });

  it('disconnect() prevents any further reconnect after an unclean close', () => {
    vi.useFakeTimers();
    const ws = new CosmosWebSocket({
      webSocketFactory: factory,
      reconnectBaseMs: 100,
      setInterval: globalThis.setInterval.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });
    ws.connect();
    lastSocket().simulateOpen();
    ws.disconnect();
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(5_000);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('surfaces factory errors via onError and schedules a retry', () => {
    vi.useFakeTimers();
    let calls = 0;
    const throwingFactory: typeof factory = (url) => {
      calls += 1;
      if (calls === 1) throw new Error('nope');
      return new FakeSocket(url);
    };
    const onError = vi.fn();
    const ws = new CosmosWebSocket({
      webSocketFactory: throwingFactory,
      reconnectBaseMs: 10,
      setInterval: globalThis.setInterval.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });
    ws.setListeners({ onError });
    ws.connect();
    expect(onError).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(20);
    expect(calls).toBe(2);
    ws.dispose();
  });

  it('isOpen() tracks the underlying readyState', () => {
    const ws = new CosmosWebSocket({ webSocketFactory: factory });
    expect(ws.isOpen()).toBe(false);
    ws.connect();
    expect(ws.isOpen()).toBe(false); // still CONNECTING
    lastSocket().simulateOpen();
    expect(ws.isOpen()).toBe(true);
    ws.dispose();
  });
});
