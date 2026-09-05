import "server-only";
import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink, rename } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { env } from "./env";

/**
 * Medya dosyaları: MEDIA_DIR altında scenes/, thumbs/, dubs/.
 * nginx bunları /media/... olarak servis eder; geliştirmede app/media/[...path] rotası devreye girer.
 */
/** sources: yönetim panelinden yüklenen ham kaynaklar; kesildikten sonra silinir. */
export type MediaKind = "scenes" | "thumbs" | "dubs" | "sources";

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/;

export function mediaDir(kind: MediaKind): string {
  return path.join(env().MEDIA_DIR, kind);
}

export function mediaUrl(kind: MediaKind, fileName: string): string {
  return `${env().MEDIA_BASE_URL}/${kind}/${fileName}`;
}

export function sceneVideoFileName(slug: string): string {
  return `${slug}.mp4`;
}

export function assertSafeName(name: string): string {
  if (!SAFE_NAME.test(name)) throw new Error("Geçersiz dosya adı.");
  return name;
}

export async function mediaExists(kind: MediaKind, fileName: string): Promise<{ exists: boolean; size: number; mtime?: string }> {
  try {
    const s = await stat(path.join(mediaDir(kind), fileName));
    return { exists: s.isFile(), size: s.size, mtime: s.mtime.toISOString() };
  } catch {
    return { exists: false, size: 0 };
  }
}

/**
 * Akış halinde diske yazar: önce geçici dosyaya, sonra atomik yeniden adlandırma.
 * Bellekte tutmaz; 1–2 GB'lık videolar için uygundur.
 */
export async function saveMediaStream(kind: MediaKind, fileName: string, body: ReadableStream<Uint8Array>, maxBytes: number): Promise<number> {
  assertSafeName(fileName);
  const dir = mediaDir(kind);
  await mkdir(dir, { recursive: true });
  const finalPath = path.join(dir, fileName);
  const tmpPath = `${finalPath}.part-${Date.now()}`;
  let written = 0;
  const source = Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>);
  const counter = new (await import("node:stream")).Transform({
    transform(chunk: Buffer, _enc, cb) {
      written += chunk.length;
      if (written > maxBytes) return cb(new Error("Dosya çok büyük."));
      cb(null, chunk);
    },
  });
  try {
    await pipeline(source, counter, createWriteStream(tmpPath));
    await rename(tmpPath, finalPath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }
  return written;
}

export async function deleteMedia(kind: MediaKind, fileName: string): Promise<void> {
  assertSafeName(fileName);
  await unlink(path.join(mediaDir(kind), fileName)).catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Kaynak videolar ve disk kullanımı                                   */
/* ------------------------------------------------------------------ */

export interface SourceFile {
  name: string;
  bytes: number;
  mtime: string;
}

/** Yönetim panelinden yüklenmiş, henüz kesilmemiş kaynak videolar. */
export async function listSources(): Promise<SourceFile[]> {
  const { readdir, stat } = await import("node:fs/promises");
  const dir = mediaDir("sources");
  const names = await readdir(dir).catch(() => [] as string[]);
  const out: SourceFile[] = [];
  for (const name of names) {
    if (name.endsWith(".part") || name.includes(".part-")) continue;
    const info = await stat(path.join(dir, name)).catch(() => null);
    if (info?.isFile()) out.push({ name, bytes: info.size, mtime: info.mtime.toISOString() });
  }
  return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

export function sourcePath(name: string): string {
  return path.join(mediaDir("sources"), assertSafeName(name));
}

async function dirBytes(dir: string): Promise<number> {
  const { readdir, stat } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) total += await dirBytes(full);
    else {
      const info = await stat(full).catch(() => null);
      if (info) total += info.size;
    }
  }
  return total;
}

/** Medya dizinine gerçekten yazılabiliyor mu? Paylaşılan volume sahipliği bozuksa burada anlaşılır. */
export async function mediaWritable(): Promise<{ ok: boolean; error?: string }> {
  const { mkdir, writeFile, unlink } = await import("node:fs/promises");
  const probe = path.join(mediaDir("scenes"), `.write-probe-${process.pid}`);
  try {
    await mkdir(mediaDir("scenes"), { recursive: true });
    await writeFile(probe, "ok");
    await unlink(probe);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export interface DiskUsage {
  scenes: number;
  thumbs: number;
  dubs: number;
  sources: number;
  /** Kaynaklar için tanımlı üst sınır (bayt). */
  sourceLimit: number;
  /** Dosya sisteminde kalan boş alan (bayt); okunamazsa null. */
  free: number | null;
  /** Medya dizinine yazılabiliyor mu? false ise yüklemeler çalışmaz. */
  writable: boolean;
  writeError?: string;
}

export async function diskUsage(): Promise<DiskUsage> {
  const { statfs } = await import("node:fs/promises");
  const [scenes, thumbs, dubs, sources] = await Promise.all([
    dirBytes(mediaDir("scenes")),
    dirBytes(mediaDir("thumbs")),
    dirBytes(mediaDir("dubs")),
    dirBytes(mediaDir("sources")),
  ]);
  let free: number | null = null;
  try {
    const fs = await statfs(env().MEDIA_DIR);
    free = Number(fs.bavail) * Number(fs.bsize);
  } catch {
    free = null;
  }
  const w = await mediaWritable();
  return { scenes, thumbs, dubs, sources, sourceLimit: env().MAX_SOURCE_GB * 1024 ** 3, free, writable: w.ok, writeError: w.error };
}
