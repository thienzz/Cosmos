import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EphemerisPushMessage, WebSocketLike } from '@/api/ephemeris';
import { J2000_JD, useTimeStore } from '@/stores/timeStore';

import { TimeEngine } from '../TimeEngine';

class FakeWebSocket implements WebSocketLike {
  sent: string[] = [];
  send(data: string): void {
    this.sent.push(data);
  }
}

describe('TS-TIME-003 — playback rates', () => {
  beforeEach(() => {
    useTimeStore.getState().resetToDefault();
  });

  it('no-ops when paused', () => {
    const engine = new TimeEngine();
    const before = useTimeStore.getState().epochJD;
    useTimeStore.getState().pause();
    useTimeStore.getState().setSpeed(86_400); // 1 day/sec, would move fast
    engine.update(1000);
    expect(useTimeStore.getState().epochJD).toBe(before);
  });

  it('1× speed advances epoch in real-time (1s real = 1s sim)', () => {
    const engine = new TimeEngine();
    useTimeStore.getState().setEpoch(J2000_JD);
    useTimeStore.getState().setSpeed(1);
    useTimeStore.getState().play();
    engine.update(1000); // 1 real second
    const delta = useTimeStore.getState().epochJD - J2000_JD;
    expect(delta).toBeCloseTo(1 / 86_400, 9); // 1 sim second in days
  });

  it('86,400× advances 1 sim day per real second', () => {
    const engine = new TimeEngine();
    useTimeStore.getState().setEpoch(J2000_JD);
    useTimeStore.getState().setSpeed(86_400);
    useTimeStore.getState().play();
    engine.update(1000);
    expect(useTimeStore.getState().epochJD - J2000_JD).toBeCloseTo(1, 9);
  });

  it('100,000× (TASKS.md T11 upper bound) still stable', () => {
    const engine = new TimeEngine();
    useTimeStore.getState().setEpoch(J2000_JD);
    useTimeStore.getState().setSpeed(100_000);
    useTimeStore.getState().play();
    engine.update(16.7); // one frame
    const deltaSec = (16.7 / 1000) * 100_000;
    const expected = deltaSec / 86_400;
    expect(useTimeStore.getState().epochJD - J2000_JD).toBeCloseTo(expected, 9);
  });

  it('clamps at SPICE kernel upper bound', () => {
    const engine = new TimeEngine();
    const { maxEpochJD } = useTimeStore.getState();
    useTimeStore.getState().setEpoch(maxEpochJD - 0.5);
    useTimeStore.getState().setSpeed(86_400 * 1000); // super fast
    useTimeStore.getState().play();
    engine.update(10_000); // 10 real seconds @ 1000 days/s = 10,000 sim days
    expect(useTimeStore.getState().epochJD).toBe(maxEpochJD);
  });

  it('ignores non-positive or non-finite deltas', () => {
    const engine = new TimeEngine();
    useTimeStore.getState().play();
    const before = useTimeStore.getState().epochJD;
    engine.update(0);
    engine.update(-5);
    engine.update(Number.NaN);
    expect(useTimeStore.getState().epochJD).toBe(before);
  });
});

describe('TS-TIME-007 — WebSocket push / send', () => {
  let engine: TimeEngine;
  let ws: FakeWebSocket;

  beforeEach(() => {
    useTimeStore.getState().resetToDefault();
    engine = new TimeEngine({
      minSimDaysBetweenPushes: 0.05,
      minRealMsBetweenPushes: 0,
      trackedNaifIds: [399, 499],
    });
    ws = new FakeWebSocket();
    engine.attachWebSocket(ws);
  });
  afterEach(() => {
    engine.attachWebSocket(null);
  });

  it('sends time_update when epoch crosses the configured threshold', () => {
    useTimeStore.getState().setSpeed(86_400); // 1 day/s
    useTimeStore.getState().play();
    engine.update(100); // +0.1 sim days, above threshold
    expect(ws.sent).toHaveLength(1);
    const payload = JSON.parse(ws.sent[0]!) as Record<string, unknown>;
    expect(payload.type).toBe('time_update');
    expect(payload.playback_speed).toBe(86_400);
    expect(payload.bodies_requested).toEqual([399, 499]);
    expect(typeof payload.epoch_jd).toBe('number');
  });

  it('throttles so tiny deltas do not flood the channel', () => {
    useTimeStore.getState().setSpeed(86_400);
    useTimeStore.getState().play();
    for (let i = 0; i < 10; i++) engine.update(0.5); // 0.005 sim days each
    expect(ws.sent.length).toBeLessThan(2);
  });

  it('handleWebSocketMessage parses ephemeris_push and fans out', () => {
    const received: EphemerisPushMessage[] = [];
    engine.ephemerisPushDispatcher.subscribe((msg) => received.push(msg));
    const frame = JSON.stringify({
      type: 'ephemeris_push',
      epoch_jd: 2_460_000.5,
      bodies: [
        { naif_id: 399, x: 1, y: 0, z: 0 },
        { naif_id: 499, x: 1.52, y: 0, z: 0 },
      ],
    });
    const parsed = engine.handleWebSocketMessage(frame);
    expect(parsed).not.toBeNull();
    expect(received).toHaveLength(1);
    expect(received[0]?.bodies[0]?.naif_id).toBe(399);
  });

  it('drops malformed JSON and wrong-type messages', () => {
    expect(engine.handleWebSocketMessage('not json')).toBeNull();
    expect(engine.handleWebSocketMessage('{"type":"something-else"}')).toBeNull();
    expect(
      engine.handleWebSocketMessage(
        JSON.stringify({ type: 'ephemeris_push', epoch_jd: 'bad', bodies: [] }),
      ),
    ).toBeNull();
  });
});

describe('TimeEngine — miscellaneous', () => {
  beforeEach(() => useTimeStore.getState().resetToDefault());

  it('does nothing when no WebSocket is attached', () => {
    const engine = new TimeEngine();
    const spy = vi.spyOn(engine.ephemerisPushDispatcher, 'handleRawMessage');
    useTimeStore.getState().setSpeed(86_400);
    useTimeStore.getState().play();
    engine.update(100);
    expect(spy).not.toHaveBeenCalled(); // no-op
  });

  it('listenerCount tracks subscriptions', () => {
    const engine = new TimeEngine();
    const unsub = engine.ephemerisPushDispatcher.subscribe(() => undefined);
    expect(engine.ephemerisPushDispatcher.listenerCount()).toBe(1);
    unsub();
    expect(engine.ephemerisPushDispatcher.listenerCount()).toBe(0);
  });
});
