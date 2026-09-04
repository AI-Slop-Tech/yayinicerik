import { NextResponse } from "next/server";
import { LIMITS, keys, normalizeRoomCode, isValidRoomCode } from "@kngl/shared";
import { getIdentity } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import { getRoom } from "@/lib/rooms";
import { saveTake } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Replik kaydı yükleme (multipart). Dosya paylaşılan volume'a yazılır, yolu Redis'e kaydedilir.
 * Realtime sunucusu "line-done" olayıyla ilerlemeyi işaretler; worker render sırasında yolları buradan okur.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: "Kimlik bulunamadı." }, { status: 401 });

  const rl = await rateLimit("take-upload", identity.id, 60, 60);
  if (!rl.ok) return NextResponse.json({ error: "Çok hızlı yüklüyorsun." }, { status: 429 });

  const code = normalizeRoomCode((await params).code);
  if (!isValidRoomCode(code)) return NextResponse.json({ error: "Geçersiz oda kodu." }, { status: 400 });
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: "Oda bulunamadı." }, { status: 404 });
  if (room.phase !== "recording") return NextResponse.json({ error: "Oda kayıt aşamasında değil." }, { status: 409 });
  const player = room.players.find((p) => p.id === identity.id);
  if (!player) return NextResponse.json({ error: "Bu odada değilsin." }, { status: 403 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > LIMITS.maxTakeBytes + 4096) return NextResponse.json({ error: "Kayıt çok büyük." }, { status: 413 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const lineId = String(form?.get("lineId") ?? "");
  if (!(file instanceof File) || !/^[A-Za-z0-9_-]{1,40}$/.test(lineId)) {
    return NextResponse.json({ error: "Eksik alanlar." }, { status: 400 });
  }
  if (file.size > LIMITS.maxTakeBytes) return NextResponse.json({ error: "Kayıt çok büyük." }, { status: 413 });

  const ext = file.type.includes("ogg") ? "ogg" : file.type.includes("mp4") || file.type.includes("aac") ? "m4a" : "webm";
  const path = await saveTake(code, lineId, identity.id, new Uint8Array(await file.arrayBuffer()), ext);

  // Aynı replik tekrar yüklenirse eskisinin üzerine yazılır: sadece son kayıt final videoya girer.
  await redis().hset(keys.roomTakes(code), lineId, JSON.stringify({ path, playerId: identity.id, at: Date.now() }));
  await redis().expire(keys.roomTakes(code), LIMITS.roomTtlSeconds);
  return NextResponse.json({ ok: true });
}
