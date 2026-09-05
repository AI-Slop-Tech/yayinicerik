import { NextResponse } from "next/server";
import { diskUsage } from "@/lib/media";
import { requireAdmin } from "../_guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await diskUsage(), { headers: { "Cache-Control": "no-store" } });
}
