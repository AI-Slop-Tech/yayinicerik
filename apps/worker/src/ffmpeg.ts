import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
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
  /** Kaynak videoda ses kanalı var mı? Sessiz filmlerde (kamu malı arşivlerde sık) yoktur. */
  hasOriginalAudio: boolean;
}

const execFileAsync = promisify(execFile);

/**
 * Kaynak videonun ses kanalı olup olmadığını ffprobe ile belirler.
 * Sessiz bir videoda `[0:a]` filtresi kurulursa ffmpeg "invalid stream specifier" ile düşer.
 */
export async function hasAudioStream(file: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(env.FFPROBE_PATH, [
      "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", file,
    ]);
    return stdout.trim().length > 0;
  } catch {
    // ffprobe yoksa ya da dosya okunamadıysa sesi yokmuş gibi davran: render yine tamamlanır.
    return false;
  }
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
  if (o.hasOriginalAudio) {
    filters.push(`[0:a]volume=${o.originalGain}[orig]`);
    mixInputs.push("[orig]");
  }
  o.takes.forEach((t, i) => {
    const idx = i + 1;
    const delayMs = Math.max(0, Math.round(t.start * 1000));
    filters.push(
      `[${idx}:a]aresample=48000,atrim=0:${t.maxDuration.toFixed(3)},asetpts=PTS-STARTPTS,` +
        `loudnorm=I=-16:TP=-1.5:LRA=11,adelay=${delayMs}|${delayMs},apad[t${idx}]`,
    );
    mixInputs.push(`[t${idx}]`);
  });
  if (mixInputs.length === 0) {
    // Ne orijinal ses ne de kayıt var: sessiz bir ses kanalı üret ki çıktı hep aynı biçimde olsun.
    args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");
    filters.push(`[${o.takes.length + 1}:a]anull[aout]`);
  } else if (mixInputs.length === 1) {
    filters.push(`${mixInputs[0]}anull[aout]`);
  } else {
    // duration=longest: orijinal ses yoksa kayıtların tamamı korunur.
    filters.push(`${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=longest:normalize=0[aout]`);
  }

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
