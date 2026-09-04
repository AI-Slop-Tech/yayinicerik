import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

/** Tüm /api/admin uçları için ortak kapı. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Yönetici girişi gerekli." }, { status: 401 });
}
