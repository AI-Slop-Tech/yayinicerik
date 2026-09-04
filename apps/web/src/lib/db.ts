import { Pool, type QueryResultRow } from "pg";
import { env } from "./env";

/**
 * Tek bir bağlantı havuzu. Next.js dev modunda modül yeniden yüklenince
 * havuz sızmasın diye globalThis üzerinde saklanır.
 */
const globalForPg = globalThis as unknown as { __kngl_pg?: Pool };

export function db(): Pool {
  if (globalForPg.__kngl_pg) return globalForPg.__kngl_pg;
  const pool = new Pool({
    connectionString: env().DATABASE_URL,
    max: env().PG_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Sorgu takılırsa bağlantıyı sonsuza kadar meşgul etmesin.
    statement_timeout: 10_000,
    application_name: "kngl-web",
  });
  pool.on("error", (err) => {
    console.error("[pg] idle client error", err);
  });
  globalForPg.__kngl_pg = pool;
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
