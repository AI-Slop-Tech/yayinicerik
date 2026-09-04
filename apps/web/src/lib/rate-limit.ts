import { keys } from "@kngl/shared";
import { redis } from "./redis";

/**
 * Sabit pencereli sayaç (Redis INCR + EXPIRE, tek round-trip). Basit, ucuz, replikalar arası tutarlı.
 * Kaba kuvvet ve kötüye kullanımı sınırlar; nginx katmanındaki limit_req ile birlikte çalışır.
 */
const script = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {c, ttl}
`;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function rateLimit(bucket: string, id: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const [count, ttl] = (await redis().eval(script, 1, keys.rateLimit(bucket, id), windowSeconds)) as [number, number];
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: Math.max(1, ttl) };
  } catch (err) {
    // Redis erişilemezse "fail open": sınır uygulanamıyor ama site çalışmaya devam ediyor.
    console.warn("[rate-limit] redis unavailable", (err as Error).message);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
