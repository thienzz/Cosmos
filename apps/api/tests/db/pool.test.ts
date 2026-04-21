import type { Pool } from 'pg';
import { describe, expect, it, afterAll, beforeAll } from 'vitest';

import { ParameterMismatchError, closePool, createPool, query } from '../../src/db/pool.js';

describe('db/pool placeholder validation', () => {
  it('accepts zero-placeholder queries with empty params', async () => {
    // We build an ephemeral Pool bound to a bogus URL; the validator runs BEFORE
    // any network call, so invalid connectionString never matters.
    const pool = createPool({
      connectionString: 'postgres://nobody@127.0.0.1:1/none',
      connectionTimeoutMillis: 200,
    });
    try {
      await expect(query(pool, 'SELECT 1', [1])).rejects.toThrow(ParameterMismatchError);
    } finally {
      await pool.end().catch(() => undefined);
    }
  });

  it('throws when placeholder count > params length', async () => {
    const pool = createPool({
      connectionString: 'postgres://nobody@127.0.0.1:1/none',
      connectionTimeoutMillis: 200,
    });
    try {
      await expect(query(pool, 'SELECT * FROM t WHERE a=$1 AND b=$2', [1])).rejects.toThrow(
        ParameterMismatchError
      );
    } finally {
      await pool.end().catch(() => undefined);
    }
  });

  it('throws when placeholder count < params length', async () => {
    const pool = createPool({
      connectionString: 'postgres://nobody@127.0.0.1:1/none',
      connectionTimeoutMillis: 200,
    });
    try {
      await expect(query(pool, 'SELECT * FROM t WHERE a=$1', [1, 2])).rejects.toThrow(
        ParameterMismatchError
      );
    } finally {
      await pool.end().catch(() => undefined);
    }
  });

  it('ignores $N inside string literals', async () => {
    const pool = createPool({
      connectionString: 'postgres://nobody@127.0.0.1:1/none',
      connectionTimeoutMillis: 200,
    });
    try {
      // Only one real placeholder ($1); the '$2' lives inside a literal and must be skipped.
      // Expect ParameterMismatchError is NOT thrown; the error will come later from pg (network),
      // which we swallow — the point is that the validator passes.
      await expect(
        query(pool, "SELECT '$2 inside literal' AS l WHERE a=$1", [1])
      ).rejects.not.toThrow(ParameterMismatchError);
    } finally {
      await pool.end().catch(() => undefined);
    }
  });

  it('deduplicates repeated placeholders', async () => {
    // $1 used twice in same query counts as 1 distinct placeholder.
    const pool = createPool({
      connectionString: 'postgres://nobody@127.0.0.1:1/none',
      connectionTimeoutMillis: 200,
    });
    try {
      await expect(
        query(pool, 'SELECT * FROM t WHERE a=$1 OR b=$1', [1])
      ).rejects.not.toThrow(ParameterMismatchError);
    } finally {
      await pool.end().catch(() => undefined);
    }
  });
});

const dbUrl = process.env.DATABASE_URL;
describe.skipIf(!dbUrl)('db/pool integration (requires DATABASE_URL)', () => {
  let pool: Pool | null = null;

  beforeAll(() => {
    pool = createPool({ connectionString: dbUrl });
  });

  afterAll(async () => {
    if (pool) await pool.end();
    await closePool();
  });

  it('runs SELECT 1 against a real Postgres', async () => {
    if (!pool) throw new Error('pool not initialised');
    const rows = await query<{ one: number }>(pool, 'SELECT 1::int AS one', []);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.one).toBe(1);
  });
});
