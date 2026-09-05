"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownUp, Pause, Play, SkipBack, SquareDot, Trash2, Plus } from "lucide-react";
import type { SceneCharacter, SceneLine } from "@kngl/shared";

/**
 * Replik stüdyosu: videoyu oynatırken replik başlangıç/bitişlerini işaretlemeyi sağlar.
 * Saniyeleri elle yazmak yerine, konuşma başlarken "Başlat", biterken "Bitir" denir.
 * Video yoksa alanlar yine elle doldurulabilir; stüdyo yalnızca kolaylaştırıcıdır.
 */
export function LineStudio({
  videoUrl,
  hasVideo,
  duration,
  characters,
  lines,
  onChange,
  onDurationDetected,
}: {
  videoUrl: string;
  hasVideo: boolean;
  duration: number;
  characters: SceneCharacter[];
  lines: SceneLine[];
  onChange: (lines: SceneLine[]) => void;
  onDurationDetected: (seconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopAtRef = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(0);

  const upd = useCallback(
    (i: number, patch: Partial<SceneLine>) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l))),
    [lines, onChange],
  );

  /** Videoyu belirli bir ana götürür; bitiş verilirse orada durdurur. */
  const seek = useCallback((to: number, stopAt?: number) => {
    const v = videoRef.current;
    if (!v) return;
    stopAtRef.current = stopAt ?? null;
    v.currentTime = Math.max(0, to);
    void v.play().catch(() => {});
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      if (stopAtRef.current !== null && v.currentTime >= stopAtRef.current) {
        v.pause();
        stopAtRef.current = null;
      }
    };
    const onMeta = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) onDurationDetected(Math.round(v.duration));
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", () => setPlaying(true));
    v.addEventListener("pause", () => setPlaying(false));
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [onDurationDetected]);

  /** Klavye: boşluk oynat/duraklat, [ başlangıç, ] bitiş. Yazı alanındayken devre dışı. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space") {
        e.preventDefault();
        stopAtRef.current = null;
        if (v.paused) void v.play().catch(() => {});
        else v.pause();
      } else if (e.key === "[") {
        e.preventDefault();
        upd(active, { start: round(v.currentTime) });
      } else if (e.key === "]") {
        e.preventDefault();
        upd(active, { end: round(v.currentTime) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, upd]);

  const total = duration || 1;
  const overlaps = lines.map((l, i) => i > 0 && l.start < lines[i - 1].end);

  return (
    <div className="space-y-4">
      {hasVideo ? (
        <div className="sticky top-20 z-10 rounded-xl border border-line bg-surface p-3 shadow-card">
          <video ref={videoRef} src={videoUrl} className="aspect-video w-full rounded-lg bg-black" preload="metadata" playsInline />

          {/* Zaman çizelgesi: replikler videonun üzerinde şerit olarak görünür */}
          <div className="relative mt-3 h-8 overflow-hidden rounded-md bg-bg-alt">
            {lines.map((l, i) => (
              <button
                key={l.id}
                type="button"
                title={`${i + 1}. replik`}
                onClick={() => {
                  setActive(i);
                  seek(l.start, l.end);
                }}
                className={`absolute top-1 h-6 rounded ${i === active ? "ring-2 ring-primary" : ""} ${overlaps[i] ? "bg-rec/70" : "bg-accent/70"}`}
                style={{ left: `${(l.start / total) * 100}%`, width: `${Math.max(0.8, ((l.end - l.start) / total) * 100)}%` }}
              >
                <span className="sr-only">{i + 1}. repliğe git</span>
              </button>
            ))}
            <div className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${(current / total) * 100}%` }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary px-3 py-1.5" onClick={() => {
                stopAtRef.current = null;
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) void v.play().catch(() => {});
                else v.pause();
              }}>
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
            <button type="button" className="btn btn-ghost px-3 py-1.5" onClick={() => seek(Math.max(0, current - 3))}>
              <SkipBack className="size-4" aria-hidden /> 3 sn
            </button>
            <span className="font-mono text-sm tabular-nums">{current.toFixed(1)} / {duration || "?"} sn</span>
            <span className="ml-auto text-xs text-ink-faint">
              Boşluk: oynat/durdur · <kbd className="font-mono">[</kbd> başlangıç · <kbd className="font-mono">]</kbd> bitiş ({active + 1}. replik)
            </span>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-bg-alt p-3 text-sm text-ink-soft">
          Videoyu yükledikten sonra burada oynatıcı çıkar; replik zamanlarını videoyu izlerken tek tuşla işaretleyebilirsin.
          Şimdilik saniyeleri elle yazabilirsin.
        </p>
      )}

      <ol className="space-y-2">
        {lines.map((l, i) => (
          <li
            key={l.id}
            onFocusCapture={() => setActive(i)}
            className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1.6rem_8.5rem_1fr_auto] sm:items-center ${
              i === active ? "border-primary bg-primary-soft/40" : overlaps[i] ? "border-rec/50 bg-rec/5" : "border-line bg-bg-alt"
            }`}
          >
            <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
            <select className="input py-2 text-sm" value={l.characterId} onChange={(e) => upd(i, { characterId: e.target.value })}>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.id}</option>
              ))}
            </select>
            <input className="input py-2 text-sm" placeholder="Replik metni" value={l.text} required maxLength={300} onChange={(e) => upd(i, { text: e.target.value })} />
            <div className="flex flex-wrap items-center gap-1">
              {hasVideo && (
                <button type="button" className="btn btn-ghost px-2 py-1.5" title="Bu repliği oynat" onClick={() => { setActive(i); seek(l.start, l.end); }}>
                  <Play className="size-3.5" aria-hidden />
                </button>
              )}
              <input type="number" step={0.1} min={0} className="input w-20 py-1.5 text-sm" aria-label="Başlangıç" value={l.start} onChange={(e) => upd(i, { start: Number(e.target.value) })} />
              {hasVideo && (
                <button type="button" className="btn btn-secondary px-2 py-1.5" title="Başlangıcı şu ana ayarla ([)" onClick={() => { setActive(i); upd(i, { start: round(current) }); }}>
                  <SquareDot className="size-3.5" aria-hidden />
                </button>
              )}
              <input type="number" step={0.1} min={0} className="input w-20 py-1.5 text-sm" aria-label="Bitiş" value={l.end} onChange={(e) => upd(i, { end: Number(e.target.value) })} />
              {hasVideo && (
                <button type="button" className="btn btn-secondary px-2 py-1.5" title="Bitişi şu ana ayarla (])" onClick={() => { setActive(i); upd(i, { end: round(current) }); }}>
                  <SquareDot className="size-3.5 rotate-180" aria-hidden />
                </button>
              )}
              <button type="button" className="btn btn-ghost px-2 py-1.5 text-rec" title="Repliği sil" onClick={() => onChange(lines.filter((_, idx) => idx !== i))} disabled={lines.length <= 1}>
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
            {overlaps[i] && <p className="text-xs text-rec sm:col-span-4">Bir önceki replikle çakışıyor.</p>}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary px-3 py-1.5 text-xs"
          disabled={lines.length >= 60}
          onClick={() => {
            const last = lines[lines.length - 1];
            const start = hasVideo ? round(current) : last ? Math.min(duration - 1, last.end + 0.5) : 0;
            onChange([...lines, { id: `l${Date.now().toString(36)}`, characterId: characters[0]?.id ?? "c1", text: "", start, end: Math.min(duration || start + 4, start + 4) }]);
            setActive(lines.length);
          }}
        >
          <Plus className="size-3.5" aria-hidden /> Replik ekle{hasVideo ? " (şu andan)" : ""}
        </button>
        <button type="button" className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => onChange([...lines].sort((a, b) => a.start - b.start))}>
          <ArrowDownUp className="size-3.5" aria-hidden /> Zamana göre sırala
        </button>
      </div>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
