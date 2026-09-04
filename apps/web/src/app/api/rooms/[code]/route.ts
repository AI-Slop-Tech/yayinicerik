import { NextResponse } from "next/server";
import { normalizeRoomCode, isValidRoomCode } from "@kngl/shared";
import { getRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

/** Oda var mı? Katılma ekranı için hafif bir kontrol. Durum değişiklikleri Socket.IO üzerinden gelir. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeRoomCode((await params).code);
  if (!isValidRoomCode(code)) return NextResponse.json({ error: "Geçersiz oda kodu." }, { status: 400 });
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: "Oda bulunamadı ya da süresi doldu." }, { status: 404 });
  return NextResponse.json(
    { code: room.code, phase: room.phase, sceneSlug: room.sceneSlug, playerCount: room.players.filter((p) => p.connected).length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
