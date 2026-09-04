import { spawn } from "node:child_process";
import { env } from "./env.js";

export interface MixInput {
  /** Ses dosyası yolu. */
  path: string;
  /** Sahne zaman çizelgesinde başlangıç (saniye). */
  start: number;
  /** Replik süresi (saniye); daha uzun kayıtlar kırpılır. */
  maxDuration: number;
}

export interface MixOptions {
  sceneVideo: string;
  takes: MixInput[];
  output: string;
  /** 720 ya da 1080 */
  height: 720 | 1080;
  watermark: string | null;
  /** Orijinal sesin ne kadarı kalsın (0 = tamamen kapat, 0.15 = arka plan için biraz bırak). */
  originalGain: number;
}

/**
 * ffmpeg filtre grafiği:
 *  - her take: kırp, sabit ses seviyesine getir, zaman çizelgesinde konumlandır (adelay)
 *  - orijinal ses: düşük seviyede (müzik/efekt hissi kalsın)
 *  - amix ile birleştir, videoyu yeniden ölçekle, isteğe bağlı filigran
 */
export function buildArgs(o: MixOptions): string[] {
  const args: string[] = ["-y", "-hide_banner", "-loglevel", "error", "-i", o.sceneVideo];
  for (const t of o.takes) args.push("-i", t.path);

  const filters: string[] = [];
  const mixInputs: string[] = [];
  filters.push(`[0:a]volume=${o.originalGain}[orig]`);
  mixInputs.push("[orig]");
  o.takes.forEach((t, i) => {
    const idx = i + 1;
    const delayMs = Math.max(0, Math.round(t.start * 1000));
    filters.push(
      `[${idx}:a]aresample=48000,atrim=0:${t.maxDuration.toFixed(3)},asetpts=PTS-STARTPTS,` +
        `loudnorm=I=-16:TP=-1.5:LRA=11,adelay=${delayMs}|${delayMs},apad[t${idx}]`,
    );
    mixInputs.push(`[t${idx}]`);
  });
  filters.push(`${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:normalize=0[aout]`);

  const vf = [`scale=-2:${o.height}`];
  if (o.watermark) {
    const text = o.watermark.replace(/[\\':]/g, "");
    vf.push(`drawtext=text='${text}':fontcolor=white@0.65:fontsize=h/28:x=w-tw-24:y=h-th-20:shadowcolor=black@0.5:shadowx=1:shadowy=1`);
  }
  filters.push(`[0:v]${vf.join(",")}[vout]`);

  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", o.height === 1080 ? "20" : "23",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "160k",
    "-shortest",
    o.output,
  );
  return args;
}

export function runFfmpeg(args: string[], timeoutMs = 5 * 60_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(env.FFMPEG_PATH, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString().slice(-4000)));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("ffmpeg zaman aşımı"));
    }, timeoutMs);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error(`ffmpeg çıkış kodu ${code}: ${stderr.trim().slice(-800)}`));
    });
  });
}
