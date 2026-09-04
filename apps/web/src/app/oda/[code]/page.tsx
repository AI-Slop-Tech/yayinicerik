import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isValidRoomCode, normalizeRoomCode } from "@kngl/shared";
import { getIdentity, getIdentityToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { getRoom } from "@/lib/rooms";
import { getSceneById } from "@/lib/scenes";
import { RoomClient } from "@/components/room/room-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Oda ${normalizeRoomCode(code)}`, robots: { index: false } };
}

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeRoomCode((await params).code);
  if (!isValidRoomCode(code)) notFound();
  const room = await getRoom(code);
  if (!room) notFound();
  const identity = await getIdentity();
  if (!identity) redirect(`/katil?kod=${code}`);
  const [scene, token] = await Promise.all([getSceneById(room.sceneId), getIdentityToken()]);
  if (!scene || !token) notFound();

  return (
    <RoomClient
      code={code}
      scene={scene}
      identity={{ id: identity.id, nickname: identity.nickname, isVip: identity.isVip }}
      token={token}
      realtimeUrl={env().NEXT_PUBLIC_REALTIME_URL}
      initialState={room}
    />
  );
}
