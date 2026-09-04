import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDeleteSuggestion } from "@/lib/admin";
import { requireAdmin } from "../../_guard";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  await adminDeleteSuggestion(id);
  return NextResponse.json({ ok: true });
}
