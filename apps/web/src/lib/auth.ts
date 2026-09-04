import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { LIMITS, keys } from "@kngl/shared";
import { env } from "./env";
import { redis } from "./redis";
import { query, queryOne } from "./db";

/**
 * Kimlik modeli:
 * - Kayıtlı kullanıcı: e-posta + şifre (bcrypt), oturum Redis'te (kngl_sid çerezi).
 * - Misafir: imzalı, sunucu durumu gerektirmeyen kimlik (kngl_guest çerezi). Oyun oynamak için yeterli.
 * İki durumda da `Identity` döner; oda mantığı ikisini aynı görür.
 */
export interface Identity {
  id: string;
  nickname: string;
  isGuest: boolean;
  isVip: boolean;
}

const SESSION_COOKIE = "kngl_sid";
const GUEST_COOKIE = "kngl_guest";
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 gün
const GUEST_TTL = 365 * 24 * 60 * 60;

function sign(payload: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(payload).digest("base64url");
}

function verify(payload: string, sig: string): boolean {
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Misafir/oyuncu kimlik belirteci: realtime sunucusu da aynı gizli anahtarla doğrular. */
export function encodeIdentityToken(identity: Identity): string {
  const payload = Buffer.from(JSON.stringify(identity)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeIdentityToken(token: string | undefined): Identity | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !verify(payload, sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Identity;
    if (typeof data.id !== "string" || typeof data.nickname !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * `Secure` bayrağı isteğin gerçek protokolüne göre: proxy arkasında X-Forwarded-Proto,
 * yoksa site adresi. HTTP üzerinden gelen bir ziyaretçiye Secure çerez verilirse tarayıcı
 * çerezi kaydetmez ve kullanıcı sürekli takma ad ekranına döner.
 */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return env().NEXT_PUBLIC_SITE_URL.startsWith("https://");
}

const cookieBase = async () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: await isHttps(),
  path: "/",
});

export async function getIdentity(): Promise<Identity | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    try {
      const raw = await redis().get(keys.session(sid));
      if (raw) return JSON.parse(raw) as Identity;
    } catch (err) {
      console.warn("[auth] session lookup failed", (err as Error).message);
    }
  }
  return decodeIdentityToken(jar.get(GUEST_COOKIE)?.value);
}

/** Aktif kimliğin realtime için belirteci (misafir ya da kayıtlı). */
export async function getIdentityToken(): Promise<string | null> {
  const identity = await getIdentity();
  return identity ? encodeIdentityToken(identity) : null;
}

export function validateNickname(nick: string): string | null {
  const n = nick.trim().replace(/\s+/g, " ");
  if (n.length < LIMITS.nicknameMin || n.length > LIMITS.nicknameMax) return null;
  if (!/^[\p{L}\p{N} _.\-]+$/u.test(n)) return null;
  return n;
}

export async function setGuestIdentity(nickname: string): Promise<Identity> {
  const jar = await cookies();
  const existing = decodeIdentityToken(jar.get(GUEST_COOKIE)?.value);
  const identity: Identity = {
    id: existing?.id ?? `g_${randomBytes(9).toString("base64url")}`,
    nickname,
    isGuest: true,
    isVip: false,
  };
  jar.set(GUEST_COOKIE, encodeIdentityToken(identity), { ...(await cookieBase()), maxAge: GUEST_TTL });
  return identity;
}

interface UserRow {
  id: string;
  email: string;
  nickname: string;
  password_hash: string;
  is_vip: boolean;
  vip_until: string | null;
}

function toIdentity(u: UserRow): Identity {
  const vipActive = u.is_vip && (!u.vip_until || new Date(u.vip_until) > new Date());
  return { id: u.id, nickname: u.nickname, isGuest: false, isVip: vipActive };
}

async function createSession(identity: Identity) {
  const sid = randomBytes(32).toString("base64url");
  await redis().set(keys.session(sid), JSON.stringify(identity), "EX", SESSION_TTL);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sid, { ...(await cookieBase()), maxAge: SESSION_TTL });
  jar.delete(GUEST_COOKIE);
}

export async function registerUser(email: string, nickname: string, password: string): Promise<Identity | { error: string }> {
  const exists = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
  if (exists) return { error: "Bu e-posta zaten kayıtlı." };
  const hash = await bcrypt.hash(password, 11);
  const rows = await query<UserRow>(
    `INSERT INTO users (email, nickname, password_hash) VALUES ($1, $2, $3)
     RETURNING id, email, nickname, password_hash, is_vip, vip_until`,
    [email, nickname, hash],
  );
  const identity = toIdentity(rows[0]);
  await createSession(identity);
  return identity;
}

export async function loginUser(email: string, password: string): Promise<Identity | { error: string }> {
  const user = await queryOne<UserRow>(
    `SELECT id, email, nickname, password_hash, is_vip, vip_until FROM users WHERE email = $1`,
    [email],
  );
  // Kullanıcı yoksa da hash karşılaştır: zamanlama farkından e-posta sızmasın.
  const ok = await bcrypt.compare(password, user?.password_hash ?? "$2a$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) return { error: "E-posta ya da şifre hatalı." };
  query(`UPDATE users SET last_seen_at = now() WHERE id = $1`, [user.id]).catch(() => {});
  const identity = toIdentity(user);
  await createSession(identity);
  return identity;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) await redis().del(keys.session(sid)).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

/* ------------------------------------------------------------------ */
/* Yönetim paneli oturumu                                              */
/* ------------------------------------------------------------------ */
const ADMIN_COOKIE = "kngl_admin";
const ADMIN_TTL = 12 * 60 * 60; // 12 saat

export function isAdminEnabled(): boolean {
  return Boolean(env().ADMIN_PASSWORD && env().ADMIN_PASSWORD!.length >= 8);
}

export async function adminLogin(password: string): Promise<boolean> {
  const expected = env().ADMIN_PASSWORD;
  if (!isAdminEnabled() || !expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const payload = Buffer.from(JSON.stringify({ admin: true, exp: Date.now() + ADMIN_TTL * 1000 })).toString("base64url");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, `${payload}.${sign(payload)}`, { ...(await cookieBase()), maxAge: ADMIN_TTL });
  return true;
}

export async function adminLogout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminEnabled()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !verify(payload, sig)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { admin?: boolean; exp?: number };
    return data.admin === true && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
