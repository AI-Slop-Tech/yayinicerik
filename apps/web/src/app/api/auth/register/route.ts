import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser, validateNickname } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().max(200),
  nickname: z.string(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const rl = await rateLimit("register", clientIp(req.headers), 5, 600);
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla kayıt denemesi. Biraz bekle." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "E-posta geçerli olmalı, şifre en az 8 karakter." }, { status: 400 });
  const nick = validateNickname(parsed.data.nickname);
  if (!nick) return NextResponse.json({ error: "Takma ad 2–24 karakter olmalı." }, { status: 400 });
  const result = await registerUser(parsed.data.email.toLowerCase(), nick, parsed.data.password);
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json({ nickname: result.nickname });
}
