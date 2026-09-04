import "server-only";
import { randomInt } from "node:crypto";
import { LIMITS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, keys, type RoomState } from "@kngl/shared";
import { redis } from "./redis";
import type { Identity } from "./auth";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  return code;
}

/**
 * Oda kaydını Redis'e atomik olarak (SET NX) yazar. Çakışma olursa yeni kod dener.
 * Oda durumunu sonrasında realtime sunucusu yönetir; web sadece yaratır ve okur.
 */
export async function createRoom(host: Identity, scene: { id: string; slug: string }): Promise<RoomState> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const now = Date.now();
    const state: RoomState = {
      code,
      sceneId: scene.id,
      sceneSlug: scene.slug,
      hostId: host.id,
      hostIsVip: host.isVip,
      phase: "lobby",
      players: [],
      assignments: {},
      createdAt: now,
      updatedAt: now,
      renderJobId: null,
      finalVideoUrl: null,
      error: null,
    };
    const ok = await redis().set(keys.room(code), JSON.stringify(state), "EX", LIMITS.roomTtlSeconds, "NX");
    if (ok) return state;
  }
  throw new Error("Oda kodu üretilemedi, lütfen tekrar deneyin.");
}

export async function getRoom(code: string): Promise<RoomState | null> {
  const raw = await redis().get(keys.room(code));
  return raw ? (JSON.parse(raw) as RoomState) : null;
}
