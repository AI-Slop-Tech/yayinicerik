"use client";

import { useState } from "react";
import { Play, VideoOff } from "lucide-react";

/** Sahne önizleme oynatıcısı. Video yoksa afişle birlikte açıklayıcı bir durum gösterir. */
export function ScenePlayer({ src, poster, title }: { src: string; poster: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);

  return (
    <div className="card relative aspect-video overflow-hidden bg-surface-2">
      {!failed ? (
        <>
          <video
            className="size-full object-cover"
            poster={poster}
            controls={started}
            preload="metadata"
            playsInline
            onError={() => setFailed(true)}
            onPlay={() => setStarted(true)}
            aria-label={`${title} önizleme`}
          >
            <source src={src} type="video/mp4" />
          </video>
          {!started && (
            <button
              type="button"
              className="absolute inset-0 grid place-items-center bg-bg/20 transition hover:bg-bg/10"
              onClick={(e) => {
                const v = e.currentTarget.parentElement?.querySelector("video");
                v?.play().catch(() => setFailed(true));
              }}
              aria-label="Önizlemeyi oynat"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-[#1a1204] shadow-glow">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </button>
          )}
        </>
      ) : (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" className="size-full object-cover opacity-60" />
          <div className="absolute inset-0 grid place-items-center bg-bg/40 p-6 text-center">
            <div>
              <VideoOff className="mx-auto size-6 text-ink-soft" aria-hidden />
              <p className="mt-2 text-sm text-ink-soft">Önizleme videosu henüz yüklenmedi. Oyun içinde sahne akışı normal çalışır.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
