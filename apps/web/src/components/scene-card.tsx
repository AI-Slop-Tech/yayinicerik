import Link from "next/link";
import { Users, Crown, Play } from "lucide-react";
import { formatDuration, type SceneSummary } from "@kngl/shared";

export function SceneCard({ scene, priority = false }: { scene: SceneSummary; priority?: boolean }) {
  return (
    <Link
      href={`/sahne/${scene.slug}`}
      className="group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-card focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {/* SVG afişler: next/image optimizasyonuna gerek yok, doğrudan img. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene.thumbnailUrl}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 chip bg-bg/70 backdrop-blur">{scene.source}</span>
        {scene.isVip && (
          <span className="absolute right-3 top-3 chip bg-primary/90 text-[#1a1204] border-transparent">
            <Crown className="size-3" aria-hidden /> VIP
          </span>
        )}
        <span className="absolute bottom-3 left-3 font-mono text-xs text-ink/90">{formatDuration(scene.durationSeconds)}</span>
        <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-primary text-[#1a1204] opacity-0 transition group-hover:opacity-100">
          <Play className="size-4 fill-current" aria-hidden />
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">{scene.title}</h3>
        <span className="chip shrink-0" title="Karakter sayısı">
          <Users className="size-3.5" aria-hidden />
          {scene.characterCount}
        </span>
      </div>
    </Link>
  );
}

export function SceneGrid({ scenes, priorityCount = 0 }: { scenes: SceneSummary[]; priorityCount?: number }) {
  if (scenes.length === 0) {
    return (
      <div className="card p-10 text-center text-ink-soft">
        Bu filtreye uyan sahne bulunamadı. Filtreleri temizleyip tekrar dene.
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {scenes.map((s, i) => (
        <SceneCard key={s.id} scene={s} priority={i < priorityCount} />
      ))}
    </div>
  );
}
