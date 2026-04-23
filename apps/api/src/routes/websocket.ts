/**
 * WebSocket route `/v1/ws` (Doc 26 §14).
 *
 * Minimal implementation that satisfies the FE `CosmosWebSocket` contract:
 *   1. On upgrade, send a single `connected` frame so the client leaves
 *      the "connecting" state.
 *   2. Respond to client `time_update` / `viewport_update` / `ping` frames
 *      well enough that the client stays connected (we treat ping→pong;
 *      the others are accepted but no-op until the push pipelines land).
 *
 * Not yet implemented (tracked separately):
 *   - `tile_priority` frames (server-pushed prefetch hints)
 *   - `ephemeris_push` (SPICE stream)
 *   - `export_progress` (video export pipeline)
 *   - `data_version_update` (ETL cache-bust)
 *   - auth tier gating (everyone is `anonymous` today)
 *
 * Those land as their pipelines come online. Until then this keeps the
 * client reconnect loop quiet and unblocks the FE's real-time UI.
 */

import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

type ClientTier = 'anonymous' | 'registered' | 'research' | 'internal';

export interface WebsocketRouteOptions {
  /**
   * Tier reported back to the client in the `connected` frame. Always
   * `anonymous` in dev; swap in a real resolver when the auth middleware
   * lands.
   */
  readonly tier?: ClientTier;
}

export async function websocketRoutes(
  app: FastifyInstance,
  opts: WebsocketRouteOptions = {},
): Promise<void> {
  const tier: ClientTier = opts.tier ?? 'anonymous';

  app.get('/v1/ws', { websocket: true }, (socket /*, req */) => {
    const session_id = randomUUID();
    const helloFrame = {
      type: 'connected' as const,
      session_id,
      tier,
      server_time: new Date().toISOString(),
    };
    try {
      socket.send(JSON.stringify(helloFrame));
    } catch (err) {
      app.log.warn({ err, session_id }, 'ws hello send failed');
      socket.close();
      return;
    }

    socket.on('message', (raw: Buffer | string) => {
      // Parse best-effort — dropping malformed frames keeps the connection
      // alive. We don't want a bad frame from one client to trigger a
      // reconnect cascade.
      let msg: unknown;
      try {
        msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
      } catch {
        return;
      }
      if (typeof msg !== 'object' || msg === null) return;
      const type = (msg as { type?: unknown }).type;

      switch (type) {
        case 'ping':
          socket.send(JSON.stringify({ type: 'pong', server_time: new Date().toISOString() }));
          break;
        case 'time_update':
        case 'viewport_update':
          // Accepted for forward-compat. A later ticket wires these into
          // the ephemeris push + tile-priority pipelines.
          break;
        default:
          // Unknown message types are ignored silently per Doc 26 §14.4.
          break;
      }
    });

    socket.on('close', () => {
      app.log.debug({ session_id }, 'ws client closed');
    });
  });
}
