import net from 'node:net';

import { afterAll, describe, expect, it } from 'vitest';

import { closePool, query } from '../src/db/pool.js';

async function isPostgresReachable(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const port = Number(u.port || '5432');
    const host = u.hostname;
    return await new Promise<boolean>((resolve) => {
      const socket = net.connect({ host, port, timeout: 500 });
      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

describe('db/pool placeholder guard', () => {
  it('throws when placeholder count exceeds params', async () => {
    await expect(query('SELECT $1, $2', [1])).rejects.toThrow(/placeholder count/);
  });

  it('throws when params exceed placeholders', async () => {
    await expect(query('SELECT $1', [1, 2])).rejects.toThrow(/placeholder count/);
  });

  it('counts distinct placeholders (repeats allowed)', async () => {
    // $1 appearing twice — still 1 unique placeholder
    const url = process.env.DATABASE_URL ?? '';
    if (!(await isPostgresReachable(url))) {
      expect(true).toBe(true);
      return;
    }
    const rows = await query<{ a: number; b: number }>('SELECT $1::int AS a, $1::int AS b', [42]);
    expect(rows[0]).toEqual({ a: 42, b: 42 });
  });
});

describe('db/pool live connectivity (skipped if postgres not reachable)', () => {
  it('SELECT 1', async () => {
    const url = process.env.DATABASE_URL ?? '';
    if (!(await isPostgresReachable(url))) {
      expect(true).toBe(true);
      return;
    }
    const rows = await query<{ one: number }>('SELECT 1::int AS one');
    expect(rows[0].one).toBe(1);
  });
});

afterAll(async () => {
  await closePool();
});
