import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { formatDuration } from "@kngl/shared";
import { listRecentDubs } from "@/lib/dubs";

export const metadata: Metadata = { title: "Prömiyerler", description: "Ekiplerin ürettiği son prömiyer videoları." };
export const dynamic = "force-dynamic";

export default async function DubsPage() {
  const dubs = await listRecentDubs(36);
  return (
    <div className="container-x py-12">
      <p className="eyebrow mb-2">Arşiv</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Prömiyerler</h1>
      <p className="mt-3 max-w-xl text-ink-soft">Ekiplerin herkese açık bıraktığı final videolar. Her ses gerçek bir oyuncuya ait.</p>

      {dubs.length === 0 ? (
        <div className="card mt-10 p-10 text-center text-ink-soft">Henüz herkese açık prömiyer yok. İlkini senin ekibin yapsın.</div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dubs.map((d) => (
            <li key={d.id} id={d.id} className="card overflow-hidden">
              <div className="relative aspect-video bg-surface-2">
                <video className="size-full object-cover" poster={d.thumbnailUrl} controls preload="none" playsInline>
                  <source src={d.videoUrl} type="video/mp4" />
                </video>
                <span className="pointer-events-none absolute left-3 top-3 font-mono text-xs bg-bg/70 rounded px-1.5 py-0.5">
                  {formatDuration(d.durationSeconds)}
                </span>
              </div>
              <div className="p-4">
                <Link href={`/sahne/${d.sceneSlug}`} className="font-display font-semibold hover:text-primary">
                  {d.sceneTitle}
                </Link>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
                  <Users className="size-3" aria-hidden /> {d.voices.join(", ")}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-ink-faint">
                  <Eye className="size-3" aria-hidden /> {d.viewCount.toLocaleString("tr-TR")} ·{" "}
                  {new Date(d.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
