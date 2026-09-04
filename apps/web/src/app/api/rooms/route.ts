import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS } from "@kngl/shared";
import { getIdentity, setGuestIdentity, validateNickname } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createRoom } from "@/lib/rooms";
import { bumpPlayCount, getSceneBySlug } from "@/lib/scenes";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sceneSlug: z.string().min(1).max(120),
  nickname: z.string().min(LIMITS.nicknameMin).max(LIMITS.nicknameMax).optional(),
});

/** Oda oluşturma. IP başına dakikada 10; kötüye kullanım Redis'i şişiremez. */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("room-create", ip, 10, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla oda oluşturdun. Biraz sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  let identity = await getIdentity();
  if (!identity) {
    const nick = parsed.data.nickname ? validateNickname(parsed.data.nickname) : null;
    if (!nick) return NextResponse.json({ error: "Önce bir takma ad seç." }, { status: 401 });
    identity = await setGuestIdentity(nick);
  }

  const scene = await getSceneBySlug(parsed.data.sceneSlug);
  if (!scene) return NextResponse.json({ error: "Sahne bulunamadı." }, { status: 404 });
  if (scene.isVip && !identity.isVip) return NextResponse.json({ error: "Bu sahne Plus üyelerine açık." }, { status: 403 });

  const room = await createRoom(identity, scene);
  bumpPlayCount(scene.id);
  return NextResponse.json({ code: room.code }, { status: 201 });
}
