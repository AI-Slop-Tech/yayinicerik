"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Play, RotateCcw, Square } from "lucide-react";
import { formatDuration, type SceneLine } from "@kngl/shared";

type Phase = "idle" | "preview" | "countdown" | "recording" | "review" | "uploading" | "done" | "error";

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

/**
 * Tek bir replik için kayıt akışı: izle → geri sayım → kaydet (replik süresi kadar) → dinle → gönder.
 * Sahne videosu yüklenemezse süre tabanlı geri sayımla çalışmaya devam eder.
 */
export function LineRecorder({
  line,
  characterName,
  characterColor,
  videoSrc,
  done,
  onUpload,
}: {
  line: SceneLine;
  characterName: string;
  characterColor: string;
  videoSrc: string;
  done: boolean;
  onUpload: (blob: Blob) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>(done ? "done" : "idle");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const duration = Math.max(0.5, line.end - line.start);

  useEffect(() => () => stopStream(), []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
  }

  async function playSegment(muted: boolean) {
    const v = videoRef.current;
    if (!v || !videoOk) return;
    v.muted = muted;
    v.currentTime = line.start;
    try {
      await v.play();
    } catch {
      setVideoOk(false);
    }
    const stopAt = () => {
      if (v.currentTime >= line.end) {
        v.pause();
        v.removeEventListener("timeupdate", stopAt);
      }
    };
    v.addEventListener("timeupdate", stopAt);
  }

  async function preview() {
    setPhase("preview");
    await playSegment(false);
    window.setTimeout(() => setPhase((p) => (p === "preview" ? "idle" : p)), duration * 1000 + 200);
  }

  async function start() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
    } catch {
      setErr("Mikrofona erişilemedi. Tarayıcı izinlerini kontrol et.");
      setPhase("error");
      return;
    }
    setPhase("countdown");
    for (const n of [3, 2, 1]) {
      setCount(n);
      await new Promise((r) => setTimeout(r, 700));
    }
    const mime = pickMime();
    const rec = new MediaRecorder(streamRef.current!, mime ? { mimeType: mime, audioBitsPerSecond: 96_000 } : undefined);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setBlob(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      setPhase("review");
      stopStream();
    };
    recRef.current = rec;
    rec.start(250);
    setPhase("recording");
    setElapsed(0);
    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 100);
    void playSegment(true);
    window.setTimeout(() => stop(), duration * 1000 + 400);
  }

  function stop() {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }

  async function upload() {
    if (!blob) return;
    setPhase("uploading");
    try {
      await onUpload(blob);
      setPhase("done");
    } catch (e) {
      setErr((e as Error).message);
      setPhase("error");
    }
  }

  function playback() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.onended = () => URL.revokeObjectURL(url);
    void a.play();
    void playSegment(true);
  }

  const busy = phase === "countdown" || phase === "recording" || phase === "uploading";

  return (
    <div className={`card overflow-hidden ${phase === "done" ? "border-green/40" : phase === "recording" ? "border-rec/60" : ""}`}>
      <div className="relative aspect-video bg-surface-2">
        <video
          ref={videoRef}
          className="size-full object-cover"
          preload="metadata"
          playsInline
          onError={() => setVideoOk(false)}
          src={videoOk ? videoSrc : undefined}
        />
        {!videoOk && (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-ink-soft">
            Sahne videosu yüklenemedi; süre tabanlı kayıt kullanılıyor ({duration.toFixed(1)} sn).
          </div>
        )}
        {phase === "countdown" && (
          <div className="absolute inset-0 grid place-items-center bg-bg/60">
            <span className="font-display text-7xl font-black text-primary">{count}</span>
          </div>
        )}
        {phase === "recording" && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-bg/80 px-3 py-1 text-xs">
            <span className="size-2 rounded-full bg-rec animate-pulse-rec" /> KAYIT · {elapsed.toFixed(1)} / {duration.toFixed(1)} sn
          </div>
        )}
        {phase === "done" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green/90 px-2.5 py-1 text-xs font-semibold text-[#062a1f]">
            <Check className="size-3" aria-hidden /> Gönderildi
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: characterColor }}>
          <span className="size-2 rounded-full" style={{ background: characterColor }} /> {characterName}
          <span className="font-mono font-normal text-ink-faint">{formatDuration(line.start)}–{formatDuration(line.end)}</span>
        </p>
        <p className="text-lg leading-snug">{line.text}</p>

        {err && (
          <p role="alert" className="mt-3 rounded-lg border border-rec/40 bg-rec/10 p-2.5 text-xs">
            {err}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {(phase === "idle" || phase === "preview" || phase === "error" || phase === "done") && (
            <button type="button" className="btn btn-ghost" onClick={preview} disabled={busy || !videoOk}>
              <Play className="size-4" aria-hidden /> İzle
            </button>
          )}
          {(phase === "idle" || phase === "error" || phase === "done" || phase === "preview") && (
            <button type="button" className="btn btn-rec" onClick={start} disabled={busy}>
              <Mic className="size-4" aria-hidden /> {phase === "done" ? "Yeniden kaydet" : "Kaydet"}
            </button>
          )}
          {phase === "recording" && (
            <button type="button" className="btn btn-secondary" onClick={stop}>
              <Square className="size-4" aria-hidden /> Durdur
            </button>
          )}
          {phase === "review" && (
            <>
              <button type="button" className="btn btn-ghost" onClick={playback}>
                <Play className="size-4" aria-hidden /> Dinle
              </button>
              <button type="button" className="btn btn-secondary" onClick={start}>
                <RotateCcw className="size-4" aria-hidden /> Tekrar
              </button>
              <button type="button" className="btn btn-primary" onClick={upload}>
                <Check className="size-4" aria-hidden /> Bunu kullan
              </button>
            </>
          )}
          {phase === "uploading" && (
            <span className="btn btn-secondary pointer-events-none">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Gönderiliyor…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
