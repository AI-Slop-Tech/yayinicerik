import type { Metadata } from "next";
import { getIdentity } from "@/lib/auth";
import { JoinRoomForm } from "@/components/join-room-form";

export const metadata: Metadata = { title: "Koda katıl", description: "Arkadaşının paylaştığı 6 haneli oda koduyla katıl." };
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams;
  const identity = await getIdentity();
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-md">
        <p className="eyebrow mb-2">Oyna</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Koda katıl</h1>
        <p className="mt-3 text-ink-soft">Ekip kurucusunun gönderdiği altı haneli kodu yaz.</p>
        <div className="mt-8">
          <JoinRoomForm initialCode={kod ?? ""} nickname={identity?.nickname ?? null} />
        </div>
      </div>
    </div>
  );
}
