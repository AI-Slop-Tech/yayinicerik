import Link from "next/link";
import { Play, Users } from "lucide-react";
import { formatDuration } from "@kngl/shared";
import type { DubSummary } from "@/lib/dubs";

export function DubOfTheDay({ dub }: { dub: DubSummary | null }) {
  if (!dub) {
    return (
      <div className="card p-10 text-center text-ink-soft">
        Henüz öne çıkan dublaj yok. İlk videoyu sen üret!
      </div>
    );
  }
  return (
    <div className="card grid overflow-hidden md:grid-cols-[1.3fr_1fr]">
      <Link href={`/dublajlar#${dub.id}`} className="group relative aspect-video bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dub.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-[#1a1204] shadow-glow transition group-hover:scale-105">
            <Play className="size-6 fill-current" aria-hidden />
          </span>
        </span>
        <span className="absolute bottom-3 left-3 font-mono text-xs">{formatDuration(dub.durationSeconds)}</span>
      </Link>
      <div className="flex flex-col justify-between p-7">
        <div>
          <p className="eyebrow mb-2">Günün dublajı</p>
          <h3 className="font-display text-2xl font-bold leading-tight">{dub.sceneTitle}</h3>
          <p className="mt-4 text-xs font-semibold tracking-widest text-ink-faint">SESLENDİRENLER</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {dub.voices.map((v) => (
              <li key={v} className="chip">
                <Users className="size-3" aria-hidden /> {v}
              </li>
            ))}
          </ul>
        </div>
        <Link href={`/sahne/${dub.sceneSlug}`} className="btn btn-primary mt-8 self-start">
          Bu sahneyi oyna
        </Link>
      </div>
    </div>
  );
}
