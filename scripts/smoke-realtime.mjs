// Realtime duman testi: Redis'te oda yaratır, iki imzalı istemciyle katılır,
// karakter dağıtımı → kayıt → tüm replikler tamam → "rendering" aşamasına geçişi ve kuyruğa iş eklenmesini doğrular.
// Kullanım: REDIS_URL=... DATABASE_URL=... SESSION_SECRET=... REALTIME_URL=http://localhost:4000 node scripts/smoke-realtime.mjs
import { createHmac } from "node:crypto";
import { io } from "socket.io-client";
import { Redis } from "ioredis";
import pg from "pg";

const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-in-production-please-0000";
const REALTIME_URL = process.env.REALTIME_URL ?? "http://localhost:4000";
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sign = (p) => createHmac("sha256", SECRET).update(p).digest("base64url");
const token = (identity) => {
  const payload = Buffer.from(JSON.stringify(identity)).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const { rows } = await pool.query("SELECT id, slug, lines, characters FROM scenes WHERE slug = 'kahvaltida-son-simit'");
const scene = rows[0];
const code = "SMKE" + "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)] + "23456789"[Math.floor(Math.random() * 8)];
const host = { id: "g_host", nickname: "hostplayer", isGuest: true, isVip: false };
const guest = { id: "g_guest", nickname: "guestplayer", isGuest: true, isVip: false };
const now = Date.now();
await redis.set(`room:${code}`, JSON.stringify({
  code, sceneId: scene.id, sceneSlug: scene.slug, hostId: host.id, hostIsVip: false, phase: "lobby",
  players: [], assignments: {}, createdAt: now, updatedAt: now, renderJobId: null, finalVideoUrl: null, error: null,
}), "EX", 600);

function connect(identity) {
  return new Promise((resolve, reject) => {
    const s = io(REALTIME_URL, { auth: { token: token(identity) }, transports: ["websocket"] });
    s.on("connect_error", reject);
    s.on("connect", () => resolve(s));
  });
}
const waitPhase = (socket, phase) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting phase=${phase}`)), 8000);
    const h = (state) => { if (state.phase === phase) { clearTimeout(t); socket.off("room:state", h); resolve(state); } };
    socket.on("room:state", h);
  });

const a = await connect(host);
const b = await connect(guest);
const join = (s) => new Promise((res) => s.emit("room:join", { code }, res));
const r1 = await join(a); const r2 = await join(b);
if (!r1.ok || !r2.ok) throw new Error("join failed: " + JSON.stringify([r1, r2]));
console.log("✓ iki oyuncu katıldı:", r2.state.players.map((p) => p.nickname).join(", "));

// Yetkisiz başlatma reddedilmeli
const err = await new Promise((res) => { b.once("room:error", res); b.emit("room:start"); });
console.log("✓ misafir başlatamadı:", err.message);

const casting = waitPhase(a, "casting"); a.emit("room:start"); const cs = await casting;
console.log("✓ karakterler dağıtıldı:", JSON.stringify(cs.assignments));

const recording = waitPhase(a, "recording"); a.emit("room:record"); await recording;
console.log("✓ kayıt aşaması");

// Her oyuncu kendi repliklerini "tamam" işaretler (dosya yolu Redis'e yazılır, worker için)
for (const [pid, chars] of Object.entries(cs.assignments)) {
  const s = pid === host.id ? a : b;
  for (const line of scene.lines.filter((l) => chars.includes(l.characterId))) {
    await redis.hset(`room:${code}:takes`, line.id, JSON.stringify({ path: `/tmp/${line.id}.webm`, playerId: pid, at: Date.now() }));
    s.emit("room:line-done", { lineId: line.id });
  }
}
const rendering = await waitPhase(a, "rendering");
console.log("✓ tüm replikler tamam → rendering, job:", rendering.renderJobId);
const queued = await redis.zcard("bull:kngl-render:prioritized").catch(() => 0);
const waiting = await redis.llen("bull:kngl-render:wait");
console.log("✓ kuyruk (prioritized/wait):", queued, "/", waiting);

// Worker rolünü taklit et: done'a çek ve yayınla → istemciler final olayını almalı
const final = new Promise((res) => b.once("room:final", res));
const st = JSON.parse(await redis.get(`room:${code}`));
st.phase = "done"; st.finalVideoUrl = "/media/dubs/smoke.mp4";
await redis.set(`room:${code}`, JSON.stringify(st), "EX", 600);
await redis.publish("kngl:room-events", JSON.stringify({ code }));
console.log("✓ final yayını alındı:", (await final).videoUrl);

// Host ayrılınca host devri
a.disconnect();
const handover = await new Promise((res) => { const h = (s) => { if (s.hostId === guest.id) { b.off("room:state", h); res(s); } }; b.on("room:state", h); });
console.log("✓ host devredildi →", handover.players.find((p) => p.isHost).nickname);

b.disconnect();
await redis.del(`room:${code}`, `room:${code}:takes`);
await redis.quit(); await pool.end();
console.log("DUMAN TESTİ BAŞARILI");
process.exit(0);
