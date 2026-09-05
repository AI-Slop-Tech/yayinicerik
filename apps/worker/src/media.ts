import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { Job } from "bullmq";
import type { MediaJobData, MediaJobResult } from "@kngl/shared";
import { env } from "./env.js";
import { probeDuration, runFfmpeg } from "./ffmpeg.js";

/**
 * Sahne videosu hazırlama. Disk kısıtlı olduğu için tek kural var:
 * ne yüklenirse yüklensin, katalogda saklanan dosya 720p ve makul bit hızında olur.
 * 45 saniyelik bir sahne tipik olarak 2–5 MB yer kaplar; ham yükleme 500 MB olsa bile.
 */
export function buildTranscodeArgs(input: string, output: string, opts: { start?: number; duration?: number }): string[] {
  const args = ["-y", "-hide_banner", "-loglevel", "error"];
  // -ss girdiden önce: anahtar kareye hızlı atlar, uzun dosyada saniyeler yerine milisaniye sürer.
  if (opts.start !== undefined) args.push("-ss", opts.start.toFixed(2));
  args.push("-i", input);
  if (opts.duration !== undefined) args.push("-t", opts.duration.toFixed(2));
  args.push(
    // Yükseltme yapma: kaynak 720p'den küçükse olduğu gibi kalsın. Genişlik çifte yuvarlanır (yuv420p şartı).
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(env.SCENE_CRF),
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "96k", "-ac", "2",
    output,
  );
  return args;
}

export async function processMediaJob(job: Job<MediaJobData>): Promise<MediaJobResult> {
  const { kind, sceneSlug, sourcePath, start, duration, deleteSource } = job.data;
  const outDir = path.join(env.SCENE_MEDIA_DIR);
  await mkdir(outDir, { recursive: true });
  const finalPath = path.join(outDir, `${sceneSlug}.mp4`);
  const tmpPath = `${finalPath}.work-${job.id}.mp4`;

  await stat(sourcePath); // yoksa burada anlaşılır hata verir
  const args = buildTranscodeArgs(sourcePath, tmpPath, kind === "trim" ? { start, duration } : {});
  await runFfmpeg(args, 20 * 60_000);
  await rename(tmpPath, finalPath);

  if (deleteSource) await rm(sourcePath, { force: true }).catch(() => {});

  const info = await stat(finalPath);
  return { bytes: info.size, durationSeconds: Math.round(await probeDuration(finalPath)) };
}
