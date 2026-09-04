import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDeleteDub, adminPatchDub } from "@/lib/admin";
import { requireAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const parsed = z.object({ isPublic: z.boolean().optional(), isFeatured: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  await adminPatchDub(id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  await adminDeleteDub(id);
  return NextResponse.json({ ok: true });
}
