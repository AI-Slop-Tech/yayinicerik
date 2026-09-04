import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Sağlık ucu: yük dengeleyici ve orkestratör bunu yoklar.
 * Bağımlılıklar düşükse 503 döner; nginx bu replikayı havuzdan çıkarır.
 */
export async function GET() {
  const checks: Record<string, "ok" | "fail"> = { redis: "fail", postgres: "fail" };
  await Promise.all([
    redis()
      .ping()
      .then(() => (checks.redis = "ok"))
      .catch(() => {}),
    db()
      .query("SELECT 1")
      .then(() => (checks.postgres = "ok"))
      .catch(() => {}),
  ]);
  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, uptime: Math.round(process.uptime()) },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
