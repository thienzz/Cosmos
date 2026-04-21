import { describe, expect, it } from 'vitest';

import {
  BATCH_EPHEMERIS_LIMITS,
  BatchEphemerisError,
  EphemerisPushDispatcher,
  isEphemerisPushMessage,
  sendTimeUpdate,
  validateBatchEphemerisRequest,
  type WebSocketLike,
} from '../ephemeris';

class RecordingSocket implements WebSocketLike {
  sent: string[] = [];
  send(data: string): void {
    this.sent.push(data);
  }
}

describe('TS-TIME-006 — batch ephemeris request validation', () => {
  it('accepts a minimal valid request and defaults frame/observer', () => {
    const out = validateBatchEphemerisRequest({
      naif_ids: [399],
      epochs: [2_460_000.5],
    });
    expect(out.frame).toBe('ECLIPJ2000');
    expect(out.observer).toBe(10);
  });

  it('passes through explicit frame / observer', () => {
    const out = validateBatchEphemerisRequest({
      naif_ids: [399],
      epochs: [2_460_000.5],
      frame: 'J2000',
      observer: 399,
    });
    expect(out.frame).toBe('J2000');
    expect(out.observer).toBe(399);
  });

  it('rejects empty arrays', () => {
    expect(() =>
      validateBatchEphemerisRequest({ naif_ids: [], epochs: [2_460_000.5] }),
    ).toThrow(BatchEphemerisError);
    expect(() =>
      validateBatchEphemerisRequest({ naif_ids: [399], epochs: [] }),
    ).toThrow(BatchEphemerisError);
  });

  it('enforces Doc 26 §8.2 body/epoch caps', () => {
    expect(() =>
      validateBatchEphemerisRequest({
        naif_ids: Array.from({ length: BATCH_EPHEMERIS_LIMITS.maxBodies + 1 }, (_, i) => i),
        epochs: [2_460_000.5],
      }),
    ).toThrowError(/TOO_MANY_BODIES|Max 50/i);

    expect(() =>
      validateBatchEphemerisRequest({
        naif_ids: [399],
        epochs: Array.from({ length: BATCH_EPHEMERIS_LIMITS.maxEpochs + 1 }, (_, i) => i),
      }),
    ).toThrowError(/TOO_MANY_EPOCHS|Max 1000/i);
  });

  it('enforces total computation cap', () => {
    expect(() =>
      validateBatchEphemerisRequest({
        naif_ids: Array.from({ length: 50 }, (_, i) => i),
        epochs: Array.from({ length: 201 }, (_, i) => i),
      }),
    ).toThrowError(/TOO_MANY_COMPUTATIONS|Max 10/i);
  });

  it('rejects invalid NAIF ids and epochs', () => {
    const assertCode = (fn: () => unknown, code: string): void => {
      try {
        fn();
        throw new Error(`expected ${code}`);
      } catch (error) {
        expect(error).toBeInstanceOf(BatchEphemerisError);
        expect((error as BatchEphemerisError).code).toBe(code);
      }
    };
    assertCode(
      () => validateBatchEphemerisRequest({ naif_ids: [-1], epochs: [2_460_000.5] }),
      'INVALID_NAIF_ID',
    );
    assertCode(
      () => validateBatchEphemerisRequest({ naif_ids: [1.5], epochs: [2_460_000.5] }),
      'INVALID_NAIF_ID',
    );
    assertCode(
      () => validateBatchEphemerisRequest({ naif_ids: [399], epochs: [Number.NaN] }),
      'INVALID_EPOCH',
    );
  });

  it('allows exactly the documented caps', () => {
    expect(() =>
      validateBatchEphemerisRequest({
        naif_ids: Array.from({ length: BATCH_EPHEMERIS_LIMITS.maxBodies }, (_, i) => i + 1),
        epochs: Array.from({ length: 200 }, (_, i) => 2_460_000 + i),
      }),
    ).not.toThrow();
  });
});

describe('sendTimeUpdate', () => {
  it('serialises the Doc 26 §14.2.2 payload', () => {
    const ws = new RecordingSocket();
    sendTimeUpdate(ws, {
      epochJD: 2_460_780.5,
      playbackSpeed: 1,
      bodiesRequested: [199, 299, 399, 499, 599, 699, 799, 899],
    });
    expect(ws.sent).toHaveLength(1);
    const payload = JSON.parse(ws.sent[0]!) as Record<string, unknown>;
    expect(payload.type).toBe('time_update');
    expect(payload.epoch_jd).toBe(2_460_780.5);
    expect(payload.playback_speed).toBe(1);
    expect(payload.bodies_requested).toEqual([199, 299, 399, 499, 599, 699, 799, 899]);
  });
});

describe('isEphemerisPushMessage', () => {
  it('accepts a valid message', () => {
    expect(
      isEphemerisPushMessage({
        type: 'ephemeris_push',
        epoch_jd: 2_460_000.5,
        bodies: [{ naif_id: 399, x: 1, y: 2, z: 3 }],
      }),
    ).toBe(true);
  });

  it('rejects missing fields and wrong types', () => {
    expect(isEphemerisPushMessage(null)).toBe(false);
    expect(isEphemerisPushMessage({})).toBe(false);
    expect(isEphemerisPushMessage({ type: 'time_update', epoch_jd: 1, bodies: [] })).toBe(false);
    expect(
      isEphemerisPushMessage({
        type: 'ephemeris_push',
        epoch_jd: 'nope',
        bodies: [],
      }),
    ).toBe(false);
    expect(
      isEphemerisPushMessage({
        type: 'ephemeris_push',
        epoch_jd: 1,
        bodies: [{ naif_id: 399, x: 1, y: 2 }], // missing z
      }),
    ).toBe(false);
  });
});

describe('EphemerisPushDispatcher', () => {
  it('subscribes + unsubscribes without leaks', () => {
    const dispatcher = new EphemerisPushDispatcher();
    const received: number[] = [];
    const unsub = dispatcher.subscribe((msg) => received.push(msg.epoch_jd));
    expect(dispatcher.listenerCount()).toBe(1);
    unsub();
    expect(dispatcher.listenerCount()).toBe(0);
  });

  it('dispatches valid messages to every subscriber', () => {
    const dispatcher = new EphemerisPushDispatcher();
    const a: number[] = [];
    const b: number[] = [];
    dispatcher.subscribe((msg) => a.push(msg.epoch_jd));
    dispatcher.subscribe((msg) => b.push(msg.epoch_jd));
    const raw = JSON.stringify({
      type: 'ephemeris_push',
      epoch_jd: 2_460_000.5,
      bodies: [{ naif_id: 399, x: 0, y: 0, z: 0 }],
    });
    dispatcher.handleRawMessage(raw);
    expect(a).toEqual([2_460_000.5]);
    expect(b).toEqual([2_460_000.5]);
  });

  it('drops malformed frames silently', () => {
    const dispatcher = new EphemerisPushDispatcher();
    const received: number[] = [];
    dispatcher.subscribe((msg) => received.push(msg.epoch_jd));
    dispatcher.handleRawMessage('not json');
    dispatcher.handleRawMessage(JSON.stringify({ type: 'other' }));
    expect(received).toEqual([]);
  });
});
