import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGetScene, adminPatchScene } from "@/lib/admin";
import { mediaUrl, saveMediaStream } from "@/lib/media";
import { requireAdmin } from "../../../_guard";

export const dynamic = "force-dynamic";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" };

/** Afiş yükleme: JPG/PNG/WebP/SVG, en fazla 5 MB; thumbs/<slug>.<ext> olarak yazılır ve katalog adresi güncellenir. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const scene = await adminGetScene(id);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  const ext = TYPES[(req.headers.get("content-type") ?? "").split(";")[0]];
  if (!ext || !req.body) return NextResponse.json({ error: "JPG, PNG, WebP ya da SVG yükleyin." }, { status: 415 });
  try {
    const name = `${scene.slug}.${ext}`;
    await saveMediaStream("thumbs", name, req.body, 5 * 1024 * 1024);
    const url = `${mediaUrl("thumbs", name)}?v=${Date.now()}`;
    await adminPatchScene(id, { thumbnailUrl: url });
    return NextResponse.json({ ok: true, thumbnailUrl: url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
