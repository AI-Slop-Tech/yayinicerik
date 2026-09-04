import { Redis } from "ioredis";
import { randomBytes } from "node:crypto";
import { LIMITS, keys, type RoomState } from "@kngl/shared";

/**
 * Oda durumu Redis'te tek bir JSON değeri olarak yaşar. Birden fazla realtime replikası
 * aynı odayı değiştirebileceği için mutasyonlar kısa ömürlü bir kilitle sarılır.
 */
export class RoomStore {
  constructor(private readonly redis: Redis) {}

  async get(code: string): Promise<RoomState | null> {
    const raw = await this.redis.get(keys.room(code));
    return raw ? (JSON.parse(raw) as RoomState) : null;
  }

  async save(state: RoomState): Promise<void> {
    state.updatedAt = Date.now();
    await this.redis.set(keys.room(state.code), JSON.stringify(state), "EX", LIMITS.roomTtlSeconds);
  }

  /** Kilit altında oku-değiştir-yaz. `mutate` null dönerse hiçbir şey yazılmaz. */
  async update(code: string, mutate: (state: RoomState) => RoomState | null | Promise<RoomState | null>): Promise<RoomState | null> {
    const lockKey = keys.roomLock(code);
    const token = randomBytes(8).toString("hex");
    let acquired = false;
    for (let i = 0; i < 40 && !acquired; i++) {
      acquired = (await this.redis.set(lockKey, token, "PX", 2_000, "NX")) === "OK";
      if (!acquired) await new Promise((r) => setTimeout(r, 25 + Math.random() * 25));
    }
    if (!acquired) throw new Error("Oda kilidi alınamadı.");
    try {
      const state = await this.get(code);
      if (!state) return null;
      const next = await mutate(state);
      if (next) await this.save(next);
      return next ?? state;
    } finally {
      // Yalnızca kendi kilidimizi bırak.
      await this.redis.eval(`if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`, 1, lockKey, token);
    }
  }

  async takes(code: string): Promise<Record<string, { path: string; playerId: string; at: number }>> {
    const raw = await this.redis.hgetall(keys.roomTakes(code));
    const out: Record<string, { path: string; playerId: string; at: number }> = {};
    for (const [k, v] of Object.entries(raw)) out[k] = JSON.parse(v);
    return out;
  }

  async clearTakes(code: string): Promise<void> {
    await this.redis.del(keys.roomTakes(code));
  }
}
