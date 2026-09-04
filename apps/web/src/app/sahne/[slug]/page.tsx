import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Sparkles, Users, Mic } from "lucide-react";
import { formatDuration } from "@kngl/shared";
import { getSceneBySlug, listPopularScenes } from "@/lib/scenes";
import { SceneGrid } from "@/components/scene-card";
import { ScenePlayer } from "@/components/scene-player";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const scene = await getSceneBySlug(slug);
  if (!scene) return { title: "Sahne bulunamadı" };
  return {
    title: scene.title,
    description: `${scene.description} ${scene.characterCount} rol, ${formatDuration(scene.durationSeconds)}.`,
    openGraph: { images: [{ url: scene.thumbnailUrl }] },
  };
}

export default async function ScenePage({ params }: Params) {
  const { slug } = await params;
  const scene = await getSceneBySlug(slug);
  if (!scene) notFound();
  const related = (await listPopularScenes(9)).filter((s) => s.id !== scene.id).slice(0, 4);

  return (
    <div className="container-x py-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <ScenePlayer src={scene.videoUrl} poster={scene.thumbnailUrl} title={scene.title} />
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{scene.source}</span>
            <span className="chip">
              <Clock className="size-3" aria-hidden /> {formatDuration(scene.durationSeconds)}
            </span>
            <span className="chip">
              <Users className="size-3" aria-hidden /> {scene.characterCount} rol
            </span>
            {scene.isVip && (
              <span className="chip border-primary/50 text-primary">
                <Sparkles className="size-3" aria-hidden /> Plus sahnesi
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{scene.title}</h1>
          <p className="mt-3 text-ink-soft leading-relaxed">{scene.description}</p>

          <h2 className="mt-8 text-xs font-semibold tracking-widest text-ink-faint">ROLLER</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {scene.characters.map((c) => (
              <li key={c.id} className="chip">
                <span className="size-2 rounded-full" style={{ background: c.color }} /> {c.name}
                <span className="text-ink-faint">· {scene.lines.filter((l) => l.characterId === c.id).length} replik</span>
              </li>
            ))}
          </ul>

          <Link href={`/oda-olustur?sahne=${scene.slug}`} className="btn btn-primary mt-8 w-full py-3.5 text-base">
            <Mic className="size-5" aria-hidden /> Bu sahneyle ekip kur
          </Link>
          <p className="mt-3 text-center text-xs text-ink-faint">
            {scene.playCount.toLocaleString("tr-TR")} kez oynandı · {scene.characterCount} kişi yeter, kalanı seyirci.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-4 text-xs font-semibold tracking-widest text-ink-faint">REPLİKLER</h2>
        <ol className="card divide-y divide-line">
          {scene.lines.map((l, i) => {
            const c = scene.characters.find((ch) => ch.id === l.characterId);
            return (
              <li key={l.id} className="flex gap-4 p-4">
                <span className="w-10 shrink-0 font-mono text-xs text-ink-faint pt-1">{formatDuration(l.start)}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: c?.color }}>
                    {c?.name ?? `Rol ${i + 1}`}
                  </p>
                  <p className="text-sm">{l.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight">Bunları da deneyin</h2>
          <SceneGrid scenes={related} />
        </section>
      )}
    </div>
  );
}
