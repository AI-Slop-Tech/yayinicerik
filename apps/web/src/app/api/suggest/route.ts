import { NextResponse } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth";
import { query } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(3).max(200),
  url: z.string().url().max(500).optional().or(z.literal("")),
  note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit("suggest", clientIp(req.headers), 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: "Saatte en fazla 5 öneri gönderebilirsin." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Başlık gerekli; bağlantı geçerli bir adres olmalı." }, { status: 400 });
  const identity = await getIdentity();
  await query(`INSERT INTO scene_suggestions (user_id, title, url, note) VALUES ($1, $2, $3, $4)`, [
    identity && !identity.isGuest ? identity.id : null,
    parsed.data.title,
    parsed.data.url || null,
    parsed.data.note || null,
  ]);
  return NextResponse.json({ ok: true });
}
