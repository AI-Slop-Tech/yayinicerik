import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { Queue } from "bullmq";
import pino from "pino";
import { z } from "zod";
import {
  EVENTS,
  LIMITS,
  QUEUE_NAMES,
  ROOM_EVENTS_CHANNEL,
  allLinesRecorded,
  assignCharacters,
  canTransition,
  isValidRoomCode,
  linesForPlayer,
  normalizeRoomCode,
  type RenderJobData,
  type RoomPhase,
  type RoomState,
} from "@kngl/shared";
import { env } from "./env.js";
import { verifyIdentityToken, type Identity } from "./identity.js";
import { RoomStore } from "./rooms.js";
import { closeScenes, getScene } from "./scenes.js";

const log = pino({ level: env.LOG_LEVEL });

/* Redis bağlantıları: komutlar, adapter pub/sub ve olay aboneliği ayrı ayrı. */
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableAutoPipelining: true });
const pubClient = redis.duplicate();
const subClient = redis.duplicate();
const eventsSub = redis.duplicate();
for (const c of [redis, pubClient, subClient, eventsSub]) c.on("error", (e) => log.error({ err: e.message }, "redis"));

const store = new RoomStore(redis);
const renderQueue = new Queue<RenderJobData>(QUEUE_NAMES.render, {
  connection: redis,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 5_000 }, removeOnComplete: 500, removeOnFail: 1_000 },
});

const httpServer = createServer((req, res) => {
  if (req.url === "/healthz") {
    redis
      .ping()
      .then(() => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", connections: io.engine.clientsCount }));
      })
      .catch(() => {
        res.writeHead(503);
        res.end("redis down");
      });
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true, credentials: true },
  // WebSocket öncelikli: sticky session zorunluluğu kalkar, replikalar yatay ölçeklenir.
  transports: ["websocket", "polling"],
  pingInterval: 20_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 64 * 1024, // ses dosyaları HTTP üzerinden gider, socket sadece küçük olaylar taşır
  serveClient: false,
  adapter: createAdapter(pubClient, subClient),
});

type Sock = Socket & { data: { identity: Identity; roomCode: string | null } };

/* ---------- Kimlik doğrulama: bağlantı anında, imzalı belirteçle ---------- */
io.use((socket, next) => {
  const identity = verifyIdentityToken(socket.handshake.auth?.token);
  if (!identity) return next(new Error("unauthorized"));
  (socket as Sock).data.identity = identity;
  (socket as Sock).data.roomCode = null;
  next();
});

/* ---------- Basit olay hız sınırı: soket başına saniyede 20 olay ---------- */
const buckets = new WeakMap<Socket, { count: number; at: number }>();
function allow(socket: Socket): boolean {
  const now = Date.now();
  const b = buckets.get(socket) ?? { count: 0, at: now };
  if (now - b.at > 1_000) {
    b.count = 0;
    b.at = now;
  }
  b.count++;
  buckets.set(socket, b);
  return b.count <= 20;
}

function roomChannel(code: string) {
  return `room:${code}`;
}

async function broadcast(state: RoomState) {
  io.to(roomChannel(state.code)).emit(EVENTS.state, state);
}

function publicState(state: RoomState): RoomState {
  return state;
}

async function setPhase(state: RoomState, to: RoomPhase): Promise<boolean> {
  if (!canTransition(state.phase, to)) return false;
  state.phase = to;
  return true;
}

async function maybeEnqueueRender(code: string) {
  const next = await store.update(code, async (state) => {
    if (state.phase !== "recording") return null;
    const scene = await getScene(state.sceneId);
    if (!scene) return null;
    const assignments = new Map(Object.entries(state.assignments));
    const active = { players: state.players.filter((p) => (state.assignments[p.id] ?? []).length > 0) };
    if (!allLinesRecorded(active, scene, assignments)) return null;

    const takes = await store.takes(code);
    const jobData: RenderJobData = {
      roomCode: code,
      sceneId: scene.id,
      priority: state.hostIsVip ? "vip" : "normal",
      takes: scene.lines
        .filter((l) => takes[l.id])
        .map((l) => ({ lineId: l.id, playerId: takes[l.id].playerId, path: takes[l.id].path, start: l.start, end: l.end })),
    };
    // BullMQ: küçük sayı = yüksek öncelik. VIP odalar kuyruğun önüne geçer.
    const job = await renderQueue.add("render", jobData, { priority: state.hostIsVip ? 1 : 10, jobId: `${code}-${Date.now()}` });
    state.renderJobId = job.id ?? null;
    await setPhase(state, "rendering");
    return state;
  });
  if (next && next.phase === "rendering") await broadcast(next);
}

const joinSchema = z.object({ code: z.string().min(1).max(12) });
const lineSchema = z.object({ lineId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/) });

io.on("connection", (raw) => {
  const socket = raw as Sock;
  const me = socket.data.identity;
  log.debug({ id: me.id, nick: me.nickname }, "connected");

  const fail = (message: string) => socket.emit(EVENTS.error, { message });

  socket.on(EVENTS.join, async (payload, ack?: (r: unknown) => void) => {
    if (!allow(socket)) {
      ack?.({ ok: false, error: "Çok hızlı istek." });
      return fail("Çok hızlı istek.");
    }
    const parsed = joinSchema.safeParse(payload);
    const code = parsed.success ? normalizeRoomCode(parsed.data.code) : "";
    if (!isValidRoomCode(code)) {
      ack?.({ ok: false, error: "Geçersiz oda kodu." });
      return fail("Geçersiz oda kodu.");
    }

    try {
      const state = await store.update(code, (s) => {
        const existing = s.players.find((p) => p.id === me.id);
        if (existing) {
          existing.connected = true;
          existing.nickname = me.nickname;
          return s;
        }
        if (s.players.filter((p) => p.connected).length >= LIMITS.maxPlayers) throw new Error("Ekip dolu.");
        // Oyun sürerken gelenler seyirci olarak izler (karakter atanmaz).
        s.players.push({
          id: me.id,
          nickname: me.nickname,
          isHost: s.hostId === me.id,
          connected: true,
          characterId: null,
          completedLines: [],
          joinedAt: Date.now(),
        });
        return s;
      });
      if (!state) {
        ack?.({ ok: false, error: "Ekip bulunamadı ya da süresi doldu." });
        return fail("Ekip bulunamadı ya da süresi doldu.");
      }
      if (socket.data.roomCode && socket.data.roomCode !== code) socket.leave(roomChannel(socket.data.roomCode));
      socket.data.roomCode = code;
      await socket.join(roomChannel(code));
      ack?.({ ok: true, state: publicState(state) });
      await broadcast(state);
    } catch (err) {
      fail((err as Error).message);
      ack?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on(EVENTS.start, async () => {
    if (!allow(socket)) return;
    const code = socket.data.roomCode;
    if (!code) return fail("Önce odaya katıl.");
    try {
      const state = await store.update(code, async (s) => {
        if (s.hostId !== me.id) throw new Error("Kurayı yalnızca ekip kurucusu çekebilir.");
        if (!canTransition(s.phase, "casting")) throw new Error("Bu aşamada başlatılamaz.");
        const scene = await getScene(s.sceneId);
        if (!scene) throw new Error("Sahne bulunamadı.");
        const connected = s.players.filter((p) => p.connected);
        if (connected.length < LIMITS.minPlayers) throw new Error("En az bir oyuncu gerekli.");
        const map = assignCharacters(connected, scene.characters);
        s.assignments = {};
        for (const p of s.players) {
          const chars = map.get(p.id) ?? [];
          s.assignments[p.id] = chars;
          p.characterId = chars[0] ?? null;
          p.completedLines = [];
        }
        s.finalVideoUrl = null;
        s.error = null;
        s.renderJobId = null;
        await store.clearTakes(code);
        await setPhase(s, "casting");
        return s;
      });
      if (state) await broadcast(state);
    } catch (err) {
      fail((err as Error).message);
    }
  });

  socket.on(EVENTS.record, async () => {
    if (!allow(socket)) return;
    const code = socket.data.roomCode;
    if (!code) return;
    try {
      const state = await store.update(code, async (s) => {
        if (s.hostId !== me.id) throw new Error("Kayda yalnızca ekip kurucusu geçebilir.");
        if (!(await setPhase(s, "recording"))) throw new Error("Bu aşamada kayda geçilemez.");
        return s;
      });
      if (state) await broadcast(state);
    } catch (err) {
      fail((err as Error).message);
    }
  });

  socket.on(EVENTS.lineDone, async (payload) => {
    if (!allow(socket)) return;
    const code = socket.data.roomCode;
    const parsed = lineSchema.safeParse(payload);
    if (!code || !parsed.success) return;
    try {
      const state = await store.update(code, async (s) => {
        if (s.phase !== "recording") return null;
        const p = s.players.find((x) => x.id === me.id);
        if (!p) return null;
        const scene = await getScene(s.sceneId);
        if (!scene) return null;
        const mine = linesForPlayer(scene, s.assignments[me.id] ?? []).map((l) => l.id);
        if (!mine.includes(parsed.data.lineId)) throw new Error("Bu replik sana ait değil.");
        if (!p.completedLines.includes(parsed.data.lineId)) p.completedLines.push(parsed.data.lineId);
        return s;
      });
      if (state) {
        await broadcast(state);
        await maybeEnqueueRender(code);
      }
    } catch (err) {
      fail((err as Error).message);
    }
  });

  socket.on(EVENTS.restart, async () => {
    if (!allow(socket)) return;
    const code = socket.data.roomCode;
    if (!code) return;
    try {
      const state = await store.update(code, async (s) => {
        if (s.hostId !== me.id) throw new Error("Yalnızca ekip kurucusu yeniden başlatabilir.");
        if (!canTransition(s.phase, "lobby")) throw new Error("Şu an yeniden başlatılamaz.");
        s.phase = "lobby";
        s.assignments = {};
        s.renderJobId = null;
        s.finalVideoUrl = null;
        s.error = null;
        for (const p of s.players) {
          p.characterId = null;
          p.completedLines = [];
        }
        await store.clearTakes(code);
        return s;
      });
      if (state) await broadcast(state);
    } catch (err) {
      fail((err as Error).message);
    }
  });

  const leave = async () => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.data.roomCode = null;
    socket.leave(roomChannel(code));
    try {
      // Aynı kullanıcının başka bir sekmesi hâlâ bağlıysa "bağlı" kalsın.
      const others = await io.in(roomChannel(code)).fetchSockets();
      const stillHere = others.some((s) => (s.data as Sock["data"]).identity?.id === me.id);
      if (stillHere) return;
      const state = await store.update(code, (s) => {
        const p = s.players.find((x) => x.id === me.id);
        if (!p) return null;
        if (s.phase === "lobby") {
          s.players = s.players.filter((x) => x.id !== me.id);
        } else {
          p.connected = false;
        }
        // Host ayrıldıysa en eski bağlı oyuncu host olur.
        if (s.hostId === me.id) {
          const next = s.players.filter((x) => x.connected).sort((a, b) => a.joinedAt - b.joinedAt)[0];
          if (next) {
            s.hostId = next.id;
            for (const x of s.players) x.isHost = x.id === next.id;
          }
        }
        return s;
      });
      if (state) await broadcast(state);
    } catch (err) {
      log.warn({ err: (err as Error).message }, "leave failed");
    }
  };

  socket.on(EVENTS.leave, leave);
  socket.on("disconnect", leave);
});

/* ---------- Worker'dan gelen oda güncellemeleri ---------- */
eventsSub.subscribe(ROOM_EVENTS_CHANNEL).then(() => log.info("room events subscribed"));
eventsSub.on("message", async (_channel, message) => {
  try {
    const { code } = JSON.parse(message) as { code: string };
    const state = await store.get(code);
    if (!state) return;
    await broadcast(state);
    if (state.phase === "done" && state.finalVideoUrl) io.to(roomChannel(code)).emit(EVENTS.final, { videoUrl: state.finalVideoUrl });
  } catch (err) {
    log.warn({ err: (err as Error).message }, "bad room event");
  }
});

/* ---------- Başlat & zarif kapanış ---------- */
httpServer.listen(env.PORT, () => log.info({ port: env.PORT }, "realtime listening"));

async function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  httpServer.close();
  io.disconnectSockets(true);
  await Promise.allSettled([io.close(), renderQueue.close(), closeScenes()]);
  for (const c of [redis, pubClient, subClient, eventsSub]) c.disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
