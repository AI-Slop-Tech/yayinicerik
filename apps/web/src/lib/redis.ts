import Redis from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as { __kngl_redis?: Redis };

/** Paylaşılan Redis istemcisi (komutlar için). Pub/sub gerekirse ayrı bağlantı açılır. */
export function redis(): Redis {
  if (globalForRedis.__kngl_redis) return globalForRedis.__kngl_redis;
  const client = new Redis(env().REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableAutoPipelining: true,
    lazyConnect: false,
    connectTimeout: 5_000,
    retryStrategy: (times) => Math.min(times * 200, 3_000),
  });
  client.on("error", (err) => console.error("[redis]", err.message));
  globalForRedis.__kngl_redis = client;
  return client;
}
