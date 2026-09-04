import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGetScene } from "@/lib/admin";
import { deleteMedia, mediaExists, saveMediaStream, sceneVideoFileName } from "@/lib/media";
import { requireAdmin } from "../../../_guard";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB (nginx client_max_body_size ile uyumlu)

/**
 * Sahne videosu yükleme: gövde ham MP4 akışıdır (multipart değil), diske akış halinde yazılır.
 * İstemci XHR ile ilerleme gösterir. Dosya adı her zaman <slug>.mp4'tür; katalogdaki video_url buna işaret eder.
 */
export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const scene = await adminGetScene(id);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  const type = req.headers.get("content-type") ?? "";
  if (!type.startsWith("video/mp4")) return NextResponse.json({ error: "Yalnızca MP4 (H.264 + AAC) kabul edilir." }, { status: 415 });
  if (!req.body) return NextResponse.json({ error: "Boş gövde." }, { status: 400 });
  try {
    const bytes = await saveMediaStream("scenes", sceneVideoFileName(scene.slug), req.body, MAX_VIDEO_BYTES);
    return NextResponse.json({ ok: true, bytes, video: await mediaExists("scenes", sceneVideoFileName(scene.slug)) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
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
