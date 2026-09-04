import Link from "next/link";
import { Play, Mic } from "lucide-react";
import { formatDuration } from "@kngl/shared";
import type { DubSummary } from "@/lib/dubs";

/** Haftanın prömiyeri: topluluğun ürettiği bir video, afiş gibi sunulur. */
export function FeaturedPremiere({ dub }: { dub: DubSummary | null }) {
  if (!dub) {
    return <div className="card p-10 text-center text-ink-soft">Henüz öne çıkan prömiyer yok. İlkini senin ekibin yapsın.</div>;
  }
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="eyebrow mb-3">Haftanın prömiyeri</p>
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{dub.sceneTitle}</h2>
        <p className="mt-4 text-ink-soft leading-relaxed">
          {dub.voices.length} kişilik bir ekip, {formatDuration(dub.durationSeconds)} saniyelik bu sahneyi kendi sesleriyle yeniden çekti.
          Seslendirenler: <span className="font-semibold text-ink">{dub.voices.join(", ")}</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/dublajlar#${dub.id}`} className="btn btn-dark">
            <Play className="size-4 fill-current" aria-hidden /> İzle
          </Link>
          <Link href={`/oda-olustur?sahne=${dub.sceneSlug}`} className="btn btn-secondary">
            <Mic className="size-4" aria-hidden /> Aynı sahneyi biz de yapalım
          </Link>
        </div>
      </div>
      <Link href={`/dublajlar#${dub.id}`} className="group poster-frame relative aspect-video rotate-[1.5deg] shadow-card transition hover:rotate-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dub.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-white text-ink shadow-card transition group-hover:scale-105">
            <Play className="size-6 fill-current" aria-hidden />
          </span>
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-0.5 font-mono text-xs text-ink">{formatDuration(dub.durationSeconds)}</span>
      </Link>
    </div>
  );
}
