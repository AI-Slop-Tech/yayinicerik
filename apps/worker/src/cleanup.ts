import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";
import type { Redis } from "ioredis";
import type { Logger } from "pino";
import { env } from "./env.js";

/**
 * Disk temizliği. Sunucu diski sınırlı olduğu için üç kaynak düzenli olarak boşaltılır:
 *  1. Süresi dolmuş prömiyer videoları (öne çıkarılanlar korunur)
 *  2. Kullanılmayan kaynak videolar (kesme işi yapılmadan bırakılmış yüklemeler)
 *  3. Sahipsiz ham kayıtlar (oda yarıda kaldığında geriye kalan take dosyaları)
 *
 * Birden fazla worker kopyası varsa yalnızca biri çalıştırır (Redis kilidi).
 */
const LOCK_KEY = "kngl:cleanup:lock";

export async function runCleanup(pool: Pool, redis: Redis, log: Logger): Promise<void> {
  const acquired = await redis.set(LOCK_KEY, "1", "EX", 300, "NX");
  if (acquired !== "OK") return;

  try {
    await cleanExpiredDubs(pool, log);
    await cleanOldFiles(env.SOURCE_DIR, env.SOURCE_TTL_HOURS, "kaynak video", log);
    await cleanOldFiles(path.join(env.UPLOAD_DIR, "takes"), 24, "ham kayıt", log, true);
  } catch (err) {
    log.warn({ err: (err as Error).message }, "temizlik başarısız");
  }
}

/** Saklama süresi dolmuş prömiyerleri veritabanından ve diskten siler. */
async function cleanExpiredDubs(pool: Pool, log: Logger): Promise<void> {
  const { rows } = await pool.query<{ id: string; video_url: string }>(
    `DELETE FROM dubs
     WHERE is_featured = false AND created_at < now() - ($1 || ' days')::interval
     RETURNING id, video_url`,
    [env.DUB_RETENTION_DAYS],
  );
  let removed = 0;
  for (const r of rows) {
    const file = path.basename(r.video_url);
    if (!/^[A-Za-z0-9._-]+$/.test(file)) continue;
    await rm(path.join(env.OUTPUT_DIR, file), { force: true }).then(() => removed++).catch(() => {});
  }
  if (rows.length) log.info({ rows: rows.length, files: removed, days: env.DUB_RETENTION_DAYS }, "süresi dolmuş prömiyerler silindi");
}

/** Belirtilen dizinde yaşı sınırı aşan girdileri siler. */
async function cleanOldFiles(dir: string, maxAgeHours: number, label: string, log: Logger, recursive = false): Promise<void> {
  const entries = await readdir(dir).catch(() => null);
  if (!entries) return;
  const cutoff = Date.now() - maxAgeHours * 3600_000;
  let removed = 0;
  for (const name of entries) {
    const full = path.join(dir, name);
    const info = await stat(full).catch(() => null);
    if (!info || info.mtimeMs > cutoff) continue;
    await rm(full, { force: true, recursive }).then(() => removed++).catch(() => {});
  }
  if (removed) log.info({ removed, dir, label }, "eski dosyalar silindi");
}
