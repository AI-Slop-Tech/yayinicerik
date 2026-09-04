import { NextResponse } from "next/server";
import { getIdentity, getIdentityToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Oda istemcisi bunu çağırıp Socket.IO için imzalı kimlik belirtecini alır. */
export async function GET() {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ identity: null, token: null }, { headers: { "Cache-Control": "no-store" } });
  const token = await getIdentityToken();
  return NextResponse.json({ identity, token }, { headers: { "Cache-Control": "no-store" } });
}
