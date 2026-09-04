import Link from "next/link";
import { Users, Sparkles, Clock } from "lucide-react";
import { formatDuration, type SceneSummary } from "@kngl/shared";

/**
 * Sahne kartı: afiş üstte, bilgi şeridi altta. Rol sayısı büyük rakamla vurgulanır,
 * çünkü oyuncunun ilk sorusu "kaç kişi lazım?"dır.
 */
export function SceneCard({ scene, priority = false }: { scene: SceneSummary; priority?: boolean }) {
  return (
    <Link
      href={`/sahne/${scene.slug}`}
      className="group flex flex-col gap-3 rounded-[20px] p-2 transition hover:bg-surface hover:shadow-card focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="poster-frame relative aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene.thumbnailUrl}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {scene.isVip && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[11px] font-bold text-white">
            <Sparkles className="size-3" aria-hidden /> Plus
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 flex items-baseline gap-0.5 rounded-md bg-white/90 px-2 py-0.5 text-ink shadow-sm">
          <span className="font-display text-lg font-extrabold leading-none">{scene.characterCount}</span>
          <span className="text-[11px] font-semibold">rol</span>
        </span>
      </div>
      <div className="px-1.5 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{scene.source}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[17px] font-bold leading-snug group-hover:text-primary">{scene.title}</h3>
        <p className="mt-1.5 flex items-center gap-3 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden /> {formatDuration(scene.durationSeconds)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden /> {scene.playCount.toLocaleString("tr-TR")} oynanma
          </span>
        </p>
      </div>
    </Link>
  );
}

export function SceneGrid({ scenes, priorityCount = 0 }: { scenes: SceneSummary[]; priorityCount?: number }) {
  if (scenes.length === 0) {
    return <div className="card p-10 text-center text-ink-soft">Bu filtreye uyan sahne yok. Filtreleri temizleyip tekrar dene.</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {scenes.map((s, i) => (
        <SceneCard key={s.id} scene={s} priority={i < priorityCount} />
      ))}
    </div>
  );
}
