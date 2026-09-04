import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import pg from "pg";
import pino from "pino";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { LIMITS, QUEUE_NAMES, ROOM_EVENTS_CHANNEL, keys, type RenderJobData, type RoomState } from "@kngl/shared";
import { env } from "./env.js";
import { buildArgs, runFfmpeg } from "./ffmpeg.js";

const log = pino({ level: env.LOG_LEVEL });
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
redis.on("error", (e) => log.error({ err: e.message }, "redis"));
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 3, application_name: "kngl-worker" });
pool.on("error", (e) => log.error({ err: e.message }, "pg"));

interface SceneRow {
  id: string;
  slug: string;
  video_url: string;
  duration_seconds: number;
  lines: Array<{ id: string; start: number; end: number }>;
}

async function getRoom(code: string): Promise<RoomState | null> {
  const raw = await redis.get(keys.room(code));
  return raw ? (JSON.parse(raw) as RoomState) : null;
}

async function patchRoom(code: string, patch: Partial<RoomState>) {
  const state = await getRoom(code);
  if (!state) return;
  Object.assign(state, patch, { updatedAt: Date.now() });
  await redis.set(keys.room(code), JSON.stringify(state), "EX", LIMITS.roomTtlSeconds);
  await redis.publish(ROOM_EVENTS_CHANNEL, JSON.stringify({ code }));
}

/** video_url ("/media/scenes/x.mp4") → yerel kaynak dosyası. */
function sceneSourcePath(videoUrl: string): string {
  const file = path.basename(videoUrl);
  if (!/^[A-Za-z0-9._-]+$/.test(file)) throw new Error("Geçersiz sahne dosyası adı.");
  return path.join(env.SCENE_MEDIA_DIR, file);
}

async function render(job: Job<RenderJobData>) {
  const { roomCode, sceneId, takes } = job.data;
  log.info({ roomCode, takes: takes.length, attempt: job.attemptsMade + 1 }, "render start");

  const { rows } = await pool.query<SceneRow>(`SELECT id, slug, video_url, duration_seconds, lines FROM scenes WHERE id = $1`, [sceneId]);
  const scene = rows[0];
  if (!scene) throw new Error("Sahne bulunamadı.");
  const source = sceneSourcePath(scene.video_url);
  await stat(source).catch(() => {
    throw new Error(`Sahne kaynak videosu yok: ${source}`);
  });

  const room = await getRoom(roomCode);
  const vip = job.data.priority === "vip" || !!room?.hostIsVip;

  await mkdir(env.OUTPUT_DIR, { recursive: true });
  const fileName = `${roomCode.toLowerCase()}-${Date.now()}.mp4`;
  const output = path.join(env.OUTPUT_DIR, fileName);

  const args = buildArgs({
    sceneVideo: source,
    takes: takes.map((t) => ({ path: t.path, start: t.start, maxDuration: Math.min(LIMITS.maxTakeSeconds, Math.max(0.5, t.end - t.start + 0.4)) })),
    output,
    height: vip ? 1080 : 720,
    watermark: vip ? null : env.WATERMARK_TEXT,
    originalGain: 0.12,
  });
  await runFfmpeg(args);
  await job.updateProgress(90);

  const videoUrl = `${env.MEDIA_BASE_URL}/dubs/${fileName}`;
  const voices = room ? room.players.filter((p) => (room.assignments[p.id] ?? []).length > 0).map((p) => p.nickname) : [];
  await pool.query(
    `INSERT INTO dubs (room_code, scene_id, video_url, thumbnail_url, voices, duration_seconds, is_public, is_featured)
     VALUES ($1, $2, $3, NULL, $4::jsonb, $5, true, false)`,
    [roomCode, sceneId, videoUrl, JSON.stringify(voices), scene.duration_seconds],
  );

  await patchRoom(roomCode, { phase: "done", finalVideoUrl: videoUrl, error: null });

  // Ham kayıtları temizle: gizlilik + disk.
  await rm(path.join(env.UPLOAD_DIR, "takes", roomCode), { recursive: true, force: true }).catch(() => {});
  log.info({ roomCode, videoUrl }, "render done");
  return { videoUrl };
}

const worker = new Worker<RenderJobData>(QUEUE_NAMES.render, render, {
  connection: redis,
  concurrency: env.CONCURRENCY,
  lockDuration: 6 * 60_000,
  // Stall kontrolü: takılan iş başka worker tarafından devralınır.
  stalledInterval: 30_000,
});

worker.on("failed", async (job, err) => {
  log.error({ roomCode: job?.data.roomCode, err: err.message, attempts: job?.attemptsMade }, "render failed");
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await patchRoom(job.data.roomCode, { phase: "failed", error: "Video üretilemedi. Oda sahibi yeniden başlatabilir." }).catch(() => {});
  }
});
worker.on("ready", () => log.info({ concurrency: env.CONCURRENCY }, "worker ready"));

async function shutdown(signal: string) {
  log.info({ signal }, "worker shutting down");
  await worker.close();
  await pool.end();
  redis.disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
