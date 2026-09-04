"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Film, Image as ImageIcon, Trash2 } from "lucide-react";
import { UploadButton } from "./upload-button";

function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPanel({
  sceneId,
  slug,
  video,
  videoUrl,
  thumbnailUrl,
}: {
  sceneId: string;
  slug: string;
  video: { exists: boolean; size: number; mtime?: string };
  videoUrl: string;
  thumbnailUrl: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(video);
  const [thumb, setThumb] = useState(thumbnailUrl);
  const [busy, setBusy] = useState(false);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Film className="size-4 text-primary" aria-hidden /> Sahne videosu
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Dosya: <code className="font-mono">scenes/{slug}.mp4</code>
        </p>
        <div className="mt-3 rounded-xl border border-line bg-bg-alt p-3 text-sm">
          {v.exists ? (
            <>
              <p className="flex items-center gap-1.5 font-semibold text-green">
                <span className="size-2 rounded-full bg-green" /> Yüklü · {fmtBytes(v.size)}
              </p>
              {v.mtime && <p className="mt-0.5 text-xs text-ink-faint">{new Date(v.mtime).toLocaleString("tr-TR")}</p>}
              <video className="mt-3 aspect-video w-full rounded-lg bg-black" src={`${videoUrl}?v=${v.mtime ?? ""}`} controls preload="metadata" playsInline />
            </>
          ) : (
            <p className="flex items-center gap-1.5 font-semibold text-rec">
              <span className="size-2 rounded-full bg-rec" /> Video yok
            </p>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <UploadButton
            url={`/api/admin/scenes/${sceneId}/video`}
            accept="video/mp4"
            label={v.exists ? "Videoyu değiştir (MP4)" : "MP4 yükle"}
            className="btn btn-primary w-full"
            onDone={(r) => {
              const res = r as { video?: typeof video } | null;
              if (res?.video) setV(res.video);
              router.refresh();
            }}
          />
          {v.exists && (
            <button
              type="button"
              className="btn btn-ghost w-full text-rec"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Video silinsin mi?")) return;
                setBusy(true);
                await fetch(`/api/admin/scenes/${sceneId}/video`, { method: "DELETE" });
                setV({ exists: false, size: 0 });
                setBusy(false);
                router.refresh();
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Videoyu sil
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-faint">H.264 video + AAC ses, MP4 kapsayıcı. Süre alanı videonun gerçek süresiyle eşleşmeli.</p>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ImageIcon className="size-4 text-primary" aria-hidden /> Afiş
        </h2>
        <div className="poster-frame mt-3 aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="size-full object-cover" />
        </div>
        <div className="mt-3">
          <UploadButton
            url={`/api/admin/scenes/${sceneId}/thumbnail`}
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            label="Afiş yükle (4:3 önerilir)"
            className="btn btn-secondary w-full"
            onDone={(r) => {
              const res = r as { thumbnailUrl?: string } | null;
              if (res?.thumbnailUrl) setThumb(res.thumbnailUrl);
              router.refresh();
            }}
          />
        </div>
      </div>
    </aside>
  );
}
