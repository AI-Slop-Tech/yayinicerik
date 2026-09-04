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
export type MediaKind = "scenes" | "thumbs" | "dubs";

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
