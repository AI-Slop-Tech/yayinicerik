import "server-only";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAMES, type MediaJobData } from "@kngl/shared";
import { env } from "./env";

/**
 * Web yalnızca iş kuyruğa atar; ağır işi (ffmpeg) worker yapar.
 * Kuyruk bağlantısı tekil tutulur, dev modunda modül yeniden yüklenince sızmasın diye globalde.
 */
const g = globalThis as unknown as { __kngl_mediaQueue?: Queue<MediaJobData>; __kngl_queueRedis?: Redis };

function connection(): Redis {
  if (!g.__kngl_queueRedis) {
    g.__kngl_queueRedis = new Redis(env().REDIS_URL, { maxRetriesPerRequest: null });
    g.__kngl_queueRedis.on("error", (e) => console.error("[queue redis]", e.message));
  }
  return g.__kngl_queueRedis;
}

export function mediaQueue(): Queue<MediaJobData> {
  if (!g.__kngl_mediaQueue) {
    g.__kngl_mediaQueue = new Queue<MediaJobData>(QUEUE_NAMES.media, {
      connection: connection(),
      defaultJobOptions: { attempts: 2, backoff: { type: "fixed", delay: 5_000 }, removeOnComplete: 50, removeOnFail: 100 },
    });
  }
  return g.__kngl_mediaQueue;
}

export interface MediaJobStatus {
  id: string;
  state: string;
  progress: number;
  failedReason?: string;
}

export async function getMediaJob(id: string): Promise<MediaJobStatus | null> {
  const job = await mediaQueue().getJob(id);
  if (!job) return null;
  return {
    id: String(job.id),
    state: await job.getState(),
    progress: typeof job.progress === "number" ? job.progress : 0,
    failedReason: job.failedReason ?? undefined,
  };
}
