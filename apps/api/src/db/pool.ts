import pg from 'pg';

export interface QueryConfig {
  readonly text: string;
  readonly params?: readonly unknown[];
}

let pool: pg.Pool | null = null;

function createPool(): pg.Pool {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://cosmos:cosmos_dev_changeme@localhost:5432/cosmos';

  return new pg.Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 20),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 5_000),
    application_name: 'cosmos-api',
  });
}

export function getPool(): pg.Pool {
  if (pool === null) {
    pool = createPool();
  }
  return pool;
}

const PLACEHOLDER_RE = /\$(\d+)\b/g;

function countPlaceholders(text: string): number {
  const seen = new Set<number>();
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
    seen.add(Number(match[1]));
  }
  return seen.size;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const placeholderCount = countPlaceholders(text);
  if (placeholderCount !== params.length) {
    throw new Error(
      `query: placeholder count (${placeholderCount}) does not match params length (${params.length}). ` +
        `Every $N must have a corresponding parameter — NEVER string-concatenate user input.`,
    );
  }

  const p = getPool();
  const result = await p.query<T>(text, params as unknown[]);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function closePool(): Promise<void> {
  if (pool !== null) {
    const p = pool;
    pool = null;
    await p.end();
  }
}
