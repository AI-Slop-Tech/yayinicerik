import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDeleteScene, adminGetScene, adminPatchScene, adminUpdateScene, validateSceneInput } from "@/lib/admin";
import { deleteMedia, sceneVideoFileName } from "@/lib/media";
import { requireAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const uuid = z.string().uuid();

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const scene = await adminGetScene(id);
  return scene ? NextResponse.json({ scene }) : NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const v = validateSceneInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const scene = await adminUpdateScene(id, v.value);
    return scene ? NextResponse.json({ scene }) : NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  } catch (err) {
    const msg = (err as Error).message.includes("scenes_slug_key") ? "Bu slug zaten kullanılıyor." : "Sahne kaydedilemedi.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const parsed = z.object({ isPublished: z.boolean().optional(), isVip: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  try {
    await adminPatchScene(id, parsed.data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const removed = await adminDeleteScene(id);
  if (!removed) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  await deleteMedia("scenes", sceneVideoFileName(removed.slug));
  return NextResponse.json({ ok: true });
}
