/**
 * tileDecoder.worker — decodes star/galaxy/cosmic-web tile buffers off the
 * main thread (Doc 27 §8.4, §12.2).
 *
 * Protocol:
 *   → main-thread sends:
 *     { id: number; kind: 'stars' | 'galaxies' | 'cosmic-web';
 *       address: string; buffer: ArrayBuffer }
 *     with `buffer` listed in the `transfer` array (zero-copy).
 *
 *   → worker replies:
 *     { id; kind; address; ok: true;
 *       buffers: { positions, magnitudes, colorIndices, spectralTypes } }
 *     or
 *     { id; kind; address; ok: false; code; message }
 *
 * Typed arrays in the reply are transferred back to the main thread via the
 * `Transferable` list, so the worker holds no references afterwards. That
 * keeps the worker GC-friendly under sustained tile loads (~20 decodes/s
 * during active flyovers, per Doc 27 §8.5).
 */

import {
  decodeStarTileToBuffers,
  TileDecodeError,
  type StarTileBuffers,
} from '@cosmos/tile-decoder';

export type TileKind = 'stars' | 'galaxies' | 'cosmic-web';

export interface DecodeRequest {
  id: number;
  kind: TileKind;
  address: string;
  buffer: ArrayBuffer;
}

export type DecodeResponse =
  | {
      id: number;
      kind: TileKind;
      address: string;
      ok: true;
      starBuffers?: StarTileBuffers;
    }
  | {
      id: number;
      kind: TileKind;
      address: string;
      ok: false;
      code: string;
      message: string;
    };

// Guard against shared-context environments (tests may `import` this module
// without a real Worker context). The bottom `if` below only runs in a
// DedicatedWorkerGlobalScope.
declare const self: DedicatedWorkerGlobalScope;

function respond(msg: DecodeResponse, transfer: Transferable[] = []): void {
  (self as DedicatedWorkerGlobalScope).postMessage(msg, transfer);
}

export function handleDecode(request: DecodeRequest): {
  response: DecodeResponse;
  transfer: Transferable[];
} {
  try {
    if (request.kind === 'stars') {
      const star = decodeStarTileToBuffers(request.buffer);
      return {
        response: {
          id: request.id,
          kind: request.kind,
          address: request.address,
          ok: true,
          starBuffers: star,
        },
        transfer: [
          star.positions.buffer,
          star.magnitudes.buffer,
          star.colorIndices.buffer,
          star.spectralTypes.buffer,
        ],
      };
    }
    // Galaxy / cosmic-web decoders land in later tasks (T46 / T28 extensions).
    // For now return a structured not-implemented so the pool can swallow
    // cleanly instead of throwing.
    return {
      response: {
        id: request.id,
        kind: request.kind,
        address: request.address,
        ok: false,
        code: 'NOT_IMPLEMENTED',
        message: `${request.kind} decoding not implemented in worker yet`,
      },
      transfer: [],
    };
  } catch (err) {
    const code = err instanceof TileDecodeError ? err.code : 'DECODE_ERROR';
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: {
        id: request.id,
        kind: request.kind,
        address: request.address,
        ok: false,
        code,
        message,
      },
      transfer: [],
    };
  }
}

// Only wire up the message handler when actually running as a worker.
// Vitest imports this module as a plain ES module; in that context `self`
// is the jsdom window and we skip the listener to keep tests deterministic.
if (typeof self !== 'undefined' && typeof (self as DedicatedWorkerGlobalScope).postMessage === 'function') {
  const maybeWorkerScope = self as unknown as { addEventListener?: DedicatedWorkerGlobalScope['addEventListener'] };
  const isRealWorker =
    typeof DedicatedWorkerGlobalScope !== 'undefined' &&
    self instanceof DedicatedWorkerGlobalScope;
  if (isRealWorker && typeof maybeWorkerScope.addEventListener === 'function') {
    maybeWorkerScope.addEventListener('message', (event: MessageEvent<DecodeRequest>) => {
      const { response, transfer } = handleDecode(event.data);
      respond(response, transfer);
    });
  }
}
