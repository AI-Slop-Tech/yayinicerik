import { NextResponse } from "next/server";
import { z } from "zod";
import type { MediaJobData } from "@kngl/shared";
import { adminGetScene } from "@/lib/admin";
import { deleteMedia, diskUsage, saveMediaStream, sceneVideoFileName, sourcePath } from "@/lib/media";
import { mediaQueue } from "@/lib/queue";
import { requireAdmin } from "../../../_guard";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
  "video/webm": "webm",
};

/**
 * Sahne videosu yükleme. Dosya önce geçici kaynak olarak yazılır, sonra worker onu
 * 720p'ye yeniden kodlar ve kaynağı siler. Disk kısıtlı olduğu için ham dosya saklanmaz:
 * 500 MB'lık bir yükleme katalogda birkaç MB yer kaplar.
 */
export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const scene = await adminGetScene(id);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });

  const ext = TYPES[(req.headers.get("content-type") ?? "").split(";")[0]];
  if (!ext) return NextResponse.json({ error: "MP4, MOV, MKV ya da WebM yükleyin." }, { status: 415 });
  if (!req.body) return NextResponse.json({ error: "Boş gövde." }, { status: 400 });

  const disk = await diskUsage();
  const remaining = disk.sourceLimit - disk.sources;
  if (remaining <= 0) return NextResponse.json({ error: "Kaynak alanı dolu. Kaynaklar ekranından kullanılmayanları sil." }, { status: 507 });

  const tmpName = `upload-${scene.slug}.${ext}`;
  try {
    await saveMediaStream("sources", tmpName, req.body, remaining);
  } catch (err) {
    await deleteMedia("sources", tmpName);
    return NextResponse.json({ error: (err as Error).message }, { status: 413 });
  }

  const data: MediaJobData = {
    kind: "normalize",
    sceneId: scene.id,
    sceneSlug: scene.slug,
    sourcePath: sourcePath(tmpName),
    deleteSource: true,
  };
  const job = await mediaQueue().add("normalize", data, { jobId: `norm-${scene.slug}-${Date.now()}` });
  return NextResponse.json({ ok: true, jobId: job.id, processing: true }, { status: 202 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const scene = await adminGetScene(id);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  await deleteMedia("scenes", sceneVideoFileName(scene.slug));
  return NextResponse.json({ ok: true });
}
