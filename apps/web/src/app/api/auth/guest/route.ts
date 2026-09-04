import { NextResponse } from "next/server";
import { z } from "zod";
import { setGuestIdentity, validateNickname } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimit("guest", clientIp(req.headers), 30, 60);
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla deneme." }, { status: 429 });
  const parsed = z.object({ nickname: z.string() }).safeParse(await req.json().catch(() => null));
  const nick = parsed.success ? validateNickname(parsed.data.nickname) : null;
  if (!nick) return NextResponse.json({ error: "Takma ad 2–24 karakter olmalı; harf, rakam, boşluk, nokta ve tire kullanabilirsin." }, { status: 400 });
  const identity = await setGuestIdentity(nick);
  return NextResponse.json({ nickname: identity.nickname });
}
