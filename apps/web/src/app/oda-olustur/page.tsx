import type { Metadata } from "next";
import { getIdentity } from "@/lib/auth";
import { getSceneBySlug, listPopularScenes } from "@/lib/scenes";
import { CreateRoomForm } from "@/components/create-room-form";

export const metadata: Metadata = { title: "Oda kur", description: "Bir sahne seç, oda kur, kodu arkadaşlarına gönder." };
export const dynamic = "force-dynamic";

export default async function CreateRoomPage({ searchParams }: { searchParams: Promise<{ sahne?: string }> }) {
  const { sahne } = await searchParams;
  const [identity, scenes, preselected] = await Promise.all([
    getIdentity(),
    listPopularScenes(24),
    sahne ? getSceneBySlug(sahne) : Promise.resolve(null),
  ]);
  const options = preselected && !scenes.some((s) => s.id === preselected.id) ? [preselected, ...scenes] : scenes;

  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-2">Oyna</p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Oda kur</h1>
        <p className="mt-3 text-ink-soft">Bir sahne seç. Odanın kodunu gruba at; herkes tarayıcıdan katılır.</p>
        <div className="mt-8">
          <CreateRoomForm
            scenes={options.map((s) => ({ slug: s.slug, title: s.title, characterCount: s.characterCount, isVip: s.isVip, source: s.source }))}
            initialSlug={preselected?.slug ?? options[0]?.slug ?? ""}
            nickname={identity?.nickname ?? null}
            isVip={identity?.isVip ?? false}
          />
        </div>
      </div>
    </div>
  );
}
