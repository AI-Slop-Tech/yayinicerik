import { NextResponse } from "next/server";
import { z } from "zod";
import { adminLogin, isAdminEnabled } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdminEnabled()) return NextResponse.json({ error: "Yönetim paneli kapalı: ADMIN_PASSWORD ayarlanmamış." }, { status: 503 });
  const rl = await rateLimit("admin-login", clientIp(req.headers), 5, 300);
  if (!rl.ok) return NextResponse.json({ error: "Çok fazla deneme. 5 dakika bekle." }, { status: 429 });
  const parsed = z.object({ password: z.string().min(1).max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Şifre gerekli." }, { status: 400 });
  const ok = await adminLogin(parsed.data.password);
  if (!ok) return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
