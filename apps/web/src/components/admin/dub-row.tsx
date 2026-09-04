"use client";

import { useRouter } from "next/navigation";
import { Star, Eye, EyeOff } from "lucide-react";
import type { AdminDub } from "@/lib/admin";
import { DeleteButton } from "./delete-button";

export function DubRow({ dub }: { dub: AdminDub }) {
  const router = useRouter();
  async function patch(body: Record<string, boolean>) {
    await fetch(`/api/admin/dubs/${dub.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {dub.sceneTitle}
          {dub.isFeatured && <span className="chip text-primary"><Star className="size-3" aria-hidden /> Haftanın prömiyeri</span>}
          {!dub.isPublic && <span className="chip">Gizli</span>}
        </p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {dub.roomCode} · {dub.voices.join(", ") || "—"} · {dub.viewCount} görüntülenme · {new Date(dub.createdAt).toLocaleString("tr-TR")} ·{" "}
          <a href={dub.videoUrl} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">video</a>
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        <button type="button" className="btn btn-ghost px-3 py-1.5" onClick={() => patch({ isFeatured: !dub.isFeatured })}>
          <Star className="size-4" aria-hidden /> {dub.isFeatured ? "Öne çıkarma" : "Öne çıkar"}
        </button>
        <button type="button" className="btn btn-ghost px-3 py-1.5" onClick={() => patch({ isPublic: !dub.isPublic })}>
          {dub.isPublic ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />} {dub.isPublic ? "Gizle" : "Yayınla"}
        </button>
        <DeleteButton url={`/api/admin/dubs/${dub.id}`} confirm="Bu prömiyer silinsin mi?" />
      </div>
    </li>
  );
}
