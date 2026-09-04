import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("login", ip, 10, 300);
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla giriş denemesi. 5 dakika sonra tekrar dene." }, { status: 429 });
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  const result = await loginUser(parsed.data.email.toLowerCase(), parsed.data.password);
  if ("error" in result) return NextResponse.json(result, { status: 401 });
  return NextResponse.json({ nickname: result.nickname });
}
