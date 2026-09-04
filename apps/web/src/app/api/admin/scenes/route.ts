import { NextResponse } from "next/server";
import { adminCreateScene, adminListScenes, validateSceneInput } from "@/lib/admin";
import { requireAdmin } from "../_guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ scenes: await adminListScenes() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const v = validateSceneInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const scene = await adminCreateScene(v.value);
    return NextResponse.json({ scene }, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message.includes("scenes_slug_key") ? "Bu slug zaten kullanılıyor." : "Sahne kaydedilemedi.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
