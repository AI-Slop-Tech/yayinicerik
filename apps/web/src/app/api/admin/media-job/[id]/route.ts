import { NextResponse } from "next/server";
import { getMediaJob } from "@/lib/queue";
import { requireAdmin } from "../../_guard";

export const dynamic = "force-dynamic";

/** İstemci kesme işinin durumunu buradan yoklar. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!/^[A-Za-z0-9_.-]{1,80}$/.test(id)) return NextResponse.json({ error: "Geçersiz iş kimliği." }, { status: 400 });
  const job = await getMediaJob(id);
  return job ? NextResponse.json(job) : NextResponse.json({ error: "İş bulunamadı." }, { status: 404 });
}
