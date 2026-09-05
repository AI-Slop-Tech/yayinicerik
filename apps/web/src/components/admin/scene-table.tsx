"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Pencil, Sparkles } from "lucide-react";
import { LICENSE_LABELS, formatDuration, type LicenseType } from "@kngl/shared";
import { UploadButton } from "./upload-button";
import { DeleteButton } from "./delete-button";

export interface SceneRowData {
  id: string;
  slug: string;
  title: string;
  source: string;
  durationSeconds: number;
  roles: number;
  lines: number;
  isVip: boolean;
  isPublished: boolean;
  playCount: number;
  thumbnailUrl: string;
  video: { exists: boolean; size: number };
  licenseType: LicenseType;
}

export function SceneTable({ scenes }: { scenes: SceneRowData[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "missing" | "unlicensed">("all");
  const rows =
    filter === "missing" ? scenes.filter((s) => !s.video.exists)
    : filter === "unlicensed" ? scenes.filter((s) => s.licenseType === "unknown")
    : scenes;

  async function patch(id: string, body: Record<string, boolean>) {
    const res = await fetch(`/api/admin/scenes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) window.alert(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "İşlem başarısız.");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button type="button" className={`chip ${filter === "all" ? "border-primary text-primary" : ""}`} onClick={() => setFilter("all")}>
          Hepsi ({scenes.length})
        </button>
        <button type="button" className={`chip ${filter === "missing" ? "border-primary text-primary" : ""}`} onClick={() => setFilter("missing")}>
          Videosu eksik ({scenes.filter((s) => !s.video.exists).length})
        </button>
        <button type="button" className={`chip ${filter === "unlicensed" ? "border-primary text-primary" : ""}`} onClick={() => setFilter("unlicensed")}>
          Lisansı belirsiz ({scenes.filter((s) => s.licenseType === "unknown").length})
        </button>
      </div>
      <ul className="card divide-y divide-line">
        {rows.map((s) => (
          <li key={s.id} className="grid gap-4 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
            <div className="poster-frame aspect-[4/3] w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.thumbnailUrl} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/sahne/${s.id}`} className="font-display font-bold hover:text-primary">
                  {s.title}
                </Link>
                {!s.isPublished && <span className="chip">Gizli</span>}
                {s.isVip && (
                  <span className="chip text-primary">
                    <Sparkles className="size-3" aria-hidden /> Plus
                  </span>
                )}
                <span className={`chip ${s.video.exists ? "text-green" : "text-rec"}`}>
                  <span className={`size-1.5 rounded-full ${s.video.exists ? "bg-green" : "bg-rec"}`} /> {s.video.exists ? "Video yüklü" : "Video yok"}
                </span>
                <span className={`chip ${s.licenseType === "unknown" ? "text-rec" : ""}`}>{LICENSE_LABELS[s.licenseType]}</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {s.source} · {formatDuration(s.durationSeconds)} · {s.roles} rol · {s.lines} replik · {s.playCount.toLocaleString("tr-TR")} oynanma ·{" "}
                <code className="font-mono">{s.slug}</code>
              </p>
              <div className="mt-2 max-w-xs">
                <UploadButton url={`/api/admin/scenes/${s.id}/video`} accept="video/mp4" label={s.video.exists ? "Videoyu değiştir" : "MP4 yükle"} className="btn btn-secondary px-3 py-1.5 text-xs" onDone={() => router.refresh()} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 md:flex-col md:items-end">
              <Link href={`/admin/sahne/${s.id}`} className="btn btn-ghost px-3 py-1.5">
                <Pencil className="size-4" aria-hidden /> Düzenle
              </Link>
              <button type="button" className="btn btn-ghost px-3 py-1.5" onClick={() => patch(s.id, { isPublished: !s.isPublished })}>
                {s.isPublished ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />} {s.isPublished ? "Gizle" : "Yayınla"}
              </button>
              <DeleteButton url={`/api/admin/scenes/${s.id}`} confirm={`"${s.title}" ve videosu kalıcı olarak silinsin mi?`} />
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="p-8 text-center text-sm text-ink-soft">Bu filtrede sahne yok.</li>}
      </ul>
    </div>
  );
}
