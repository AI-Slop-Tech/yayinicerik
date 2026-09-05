import { NextResponse } from "next/server";
import { z } from "zod";
import type { MediaJobData } from "@kngl/shared";
import { adminGetScene } from "@/lib/admin";
import { sourcePath } from "@/lib/media";
import { mediaQueue } from "@/lib/queue";
import { requireAdmin } from "../../_guard";

export const dynamic = "force-dynamic";

const schema = z.object({
  sourceName: z.string().min(1).max(120),
  sceneId: z.string().uuid(),
  start: z.number().min(0).max(24 * 3600),
  duration: z.number().min(1).max(900),
  /** Kesme bittikten sonra kaynak silinsin mi? Aynı filmden başka sahne çıkaracaksan false. */
  deleteSource: z.boolean().default(false),
});

/** Kaynak videodan bir aralık keser; iş worker'da çalışır, sonuç sahnenin videosu olur. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek: kaynak, sahne, başlangıç ve süre gerekli." }, { status: 400 });

  const scene = await adminGetScene(parsed.data.sceneId);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });

  let src: string;
  try {
    src = sourcePath(parsed.data.sourceName);
  } catch {
    return NextResponse.json({ error: "Geçersiz kaynak adı." }, { status: 400 });
  }

  const data: MediaJobData = {
    kind: "trim",
    sceneId: scene.id,
    sceneSlug: scene.slug,
    sourcePath: src,
    start: parsed.data.start,
    duration: parsed.data.duration,
    deleteSource: parsed.data.deleteSource,
  };
  const job = await mediaQueue().add("trim", data, { jobId: `trim-${scene.slug}-${Date.now()}` });
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
