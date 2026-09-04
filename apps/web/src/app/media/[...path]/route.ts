import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = { ".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

/**
 * Medya servis rotası (Range destekli). Üretimde nginx /media/ konumunu doğrudan diskten servis eder ve
 * bu rota hiç çağrılmaz; geliştirmede ve nginx'siz kurulumlarda devreye girer.
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  if (!parts || parts.length < 2 || parts.some((p) => !/^[a-z0-9][a-z0-9._-]*$/i.test(p) || p.includes(".."))) {
    return new NextResponse("Bulunamadı", { status: 404 });
  }
  const file = path.join(env().MEDIA_DIR, ...parts);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new NextResponse("Bulunamadı", { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.get("range");
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600" };
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Math.min(Number(m[2]), info.size - 1) : info.size - 1;
      if (start <= end && start < info.size) {
        headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
        headers["Content-Length"] = String(end - start + 1);
        return new NextResponse(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, { status: 206, headers });
      }
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
  }
  headers["Content-Length"] = String(info.size);
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, { status: 200, headers });
}
