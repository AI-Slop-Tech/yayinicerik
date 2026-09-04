import { keys } from "@kngl/shared";
import { redis } from "./redis";

/**
 * İki kademeli önbellek: süreç içi (mikro, ms düzeyinde) + Redis (replikalar arası paylaşılan).
 * Aynı anahtar için eşzamanlı istekler tek bir üreticiye bağlanır (request coalescing),
 * böylece trafik patlamalarında veritabanına "stampede" olmaz.
 */
type Entry<T> = { value: T; expiresAt: number };

const local = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const LOCAL_MAX_ENTRIES = 500;

function localGet<T>(key: string): T | undefined {
  const e = local.get(key);
  if (!e) return undefined;
  if (e.expiresAt < Date.now()) {
    local.delete(key);
    return undefined;
  }
  return e.value as T;
}

function localSet<T>(key: string, value: T, ttlMs: number) {
  if (local.size >= LOCAL_MAX_ENTRIES) {
    // En eski girdiyi at (Map ekleme sırasını korur).
    const first = local.keys().next().value;
    if (first !== undefined) local.delete(first);
  }
  local.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export interface CacheOptions {
  /** Redis TTL (saniye). */
  ttlSeconds: number;
  /** Süreç içi TTL (ms). Varsayılan: 2 sn — bir replika saniyede binlerce isteği DB'ye gitmeden karşılar. */
  localTtlMs?: number;
}

export async function cached<T>(name: string, opts: CacheOptions, producer: () => Promise<T>): Promise<T> {
  const key = keys.cache(name);
  const hit = localGet<T>(key);
  if (hit !== undefined) return hit;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    try {
      const raw = await redis().get(key);
      if (raw) {
        const val = JSON.parse(raw) as T;
        localSet(key, val, opts.localTtlMs ?? 2_000);
        return val;
      }
    } catch (err) {
      // Redis düşerse uygulama düşmesin: doğrudan üreticiye in.
      console.warn("[cache] redis get failed", (err as Error).message);
    }
    const val = await producer();
    localSet(key, val, opts.localTtlMs ?? 2_000);
    try {
      await redis().set(key, JSON.stringify(val), "EX", opts.ttlSeconds);
    } catch (err) {
      console.warn("[cache] redis set failed", (err as Error).message);
    }
    return val;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Verilen ön ekle başlayan tüm önbellek anahtarlarını (yerel + Redis) temizler. Yönetim panelindeki değişikliklerden sonra kullanılır. */
export async function invalidatePrefix(prefix: string) {
  const full = keys.cache(prefix);
  for (const k of Array.from(local.keys())) if (k.startsWith(full)) local.delete(k);
  try {
    let cursor = "0";
    do {
      const [next, found] = await redis().scan(cursor, "MATCH", `${full}*`, "COUNT", 200);
      cursor = next;
      if (found.length) await redis().del(...found);
    } while (cursor !== "0");
  } catch (err) {
    console.warn("[cache] invalidatePrefix failed", (err as Error).message);
  }
}

export async function invalidate(...names: string[]) {
  for (const n of names) local.delete(keys.cache(n));
  try {
    if (names.length) await redis().del(...names.map((n) => keys.cache(n)));
  } catch (err) {
    console.warn("[cache] invalidate failed", (err as Error).message);
  }
}
