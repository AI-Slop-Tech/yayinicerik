import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

export interface Identity {
  id: string;
  nickname: string;
  isGuest: boolean;
  isVip: boolean;
}

/** Web'in ürettiği imzalı kimlik belirtecini doğrular (aynı SESSION_SECRET). */
export function verifyIdentityToken(token: unknown): Identity | null {
  if (typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url"));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Identity;
    if (typeof data.id !== "string" || typeof data.nickname !== "string") return null;
    return { id: data.id, nickname: data.nickname, isGuest: !!data.isGuest, isVip: !!data.isVip };
  } catch {
    return null;
  }
}
