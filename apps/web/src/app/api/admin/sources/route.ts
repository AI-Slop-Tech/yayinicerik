import { NextResponse } from "next/server";
import { deleteMedia, diskUsage, listSources, saveMediaStream } from "@/lib/media";
import { env } from "@/lib/env";
import { requireAdmin } from "../_guard";

export const dynamic = "force-dynamic";

const TYPES = ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm", "video/x-msvideo"];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ sources: await listSources(), disk: await diskUsage() }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Kaynak video yükleme. Dosya adı ?name= ile gelir, gövde ham videodur.
 * Kaynaklar geçicidir: kesildikten sonra silinir, kesilmezse worker 24 saat içinde temizler.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const name = new URL(req.url).searchParams.get("name") ?? "";
  const safe = name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/^-+/, "").slice(0, 100);
  if (!safe || !/\.(mp4|mov|mkv|webm|avi)$/.test(safe)) {
    return NextResponse.json({ error: "Dosya adı .mp4, .mov, .mkv, .webm ya da .avi ile bitmeli." }, { status: 400 });
  }
  const type = (req.headers.get("content-type") ?? "").split(";")[0];
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Desteklenmeyen video biçimi." }, { status: 415 });
  if (!req.body) return NextResponse.json({ error: "Boş gövde." }, { status: 400 });

  // Disk kısıtı: kaynaklar toplamda MAX_SOURCE_GB'ı aşamaz.
  const disk = await diskUsage();
  const remaining = disk.sourceLimit - disk.sources;
  if (remaining <= 0) {
    return NextResponse.json(
      { error: `Kaynak alanı dolu (${env().MAX_SOURCE_GB} GB). Kullanmadığın kaynakları sil ya da kes.` },
      { status: 507 },
    );
  }

  try {
    const bytes = await saveMediaStream("sources", safe, req.body, remaining);
    return NextResponse.json({ ok: true, name: safe, bytes });
  } catch (err) {
    await deleteMedia("sources", safe);
    const msg = (err as Error).message === "Dosya çok büyük." ? `Kaynak alanı sınırı aşıldı (${env().MAX_SOURCE_GB} GB).` : (err as Error).message;
    return NextResponse.json({ error: msg }, { status: 413 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const name = new URL(req.url).searchParams.get("name") ?? "";
  try {
    await deleteMedia("sources", name);
  } catch {
    return NextResponse.json({ error: "Geçersiz dosya adı." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
