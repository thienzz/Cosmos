import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _getEngineBridge,
  registerEngineBridge,
  requestCancelFlyTo,
  requestFlyToEntity,
  requestSetTrackedEntity,
  resetEngineBridge,
} from '../engineBridge';

describe('engineBridge', () => {
  beforeEach(() => resetEngineBridge());
  afterEach(() => resetEngineBridge());

  it('requestFlyToEntity returns false when no handler registered', () => {
    expect(requestFlyToEntity(399)).toBe(false);
  });

  it('forwards to the registered handler and returns its result', () => {
    const handler = vi.fn(() => true);
    registerEngineBridge({ flyToEntity: handler });
    const result = requestFlyToEntity(399, { durationSec: 2 });
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledWith(399, { durationSec: 2 });
  });

  it('requestCancelFlyTo forwards to cancel handler', () => {
    const cancel = vi.fn();
    registerEngineBridge({ cancelFlyTo: cancel });
    requestCancelFlyTo();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('unregister removes its own handlers without clobbering others', () => {
    const flyA = vi.fn(() => true);
    const flyB = vi.fn(() => true);
    const cancelB = vi.fn();
    const unA = registerEngineBridge({ flyToEntity: flyA });
    const unB = registerEngineBridge({ flyToEntity: flyB, cancelFlyTo: cancelB });

    // Last writer wins — flyB is the current flyToEntity handler.
    expect(_getEngineBridge().flyToEntity).toBe(flyB);

    unB();
    // After unregistering B, the flyToEntity handler B is removed entirely —
    // it doesn't fall back to A. (Registration is last-writer-wins, not stacked.)
    expect(_getEngineBridge().flyToEntity).toBeUndefined();
    expect(_getEngineBridge().cancelFlyTo).toBeUndefined();

    unA(); // idempotent
    expect(_getEngineBridge().flyToEntity).toBeUndefined();
  });

  it('resetEngineBridge clears everything', () => {
    registerEngineBridge({ flyToEntity: () => true, cancelFlyTo: () => {} });
    resetEngineBridge();
    expect(requestFlyToEntity(1)).toBe(false);
  });

  it('requestSetTrackedEntity returns false when no handler registered', () => {
    expect(requestSetTrackedEntity(399)).toBe(false);
    expect(requestSetTrackedEntity(null)).toBe(false);
  });

  it('requestSetTrackedEntity forwards to the registered handler', () => {
    const handler = vi.fn((id: number | null) => id !== null);
    registerEngineBridge({ setTrackedEntity: handler });
    expect(requestSetTrackedEntity(399)).toBe(true);
    expect(handler).toHaveBeenCalledWith(399);
    expect(requestSetTrackedEntity(null)).toBe(false);
    expect(handler).toHaveBeenCalledWith(null);
  });
});
