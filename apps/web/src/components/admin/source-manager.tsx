"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Scissors, Trash2, Upload } from "lucide-react";

interface SourceFile {
  name: string;
  bytes: number;
  mtime: string;
}
interface SceneOption {
  id: string;
  title: string;
  slug: string;
  hasVideo: boolean;
}

function fmt(n: number): string {
  return n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(0)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;
}
function hhmmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Kaynak videodan sahne kesme. Uzun dosya bir kez yüklenir, üstünden birden çok sahne çıkarılır.
 * Kesme işini worker yapar; burada yalnızca aralık seçilir ve iş yoklanır.
 */
export function SourceManager({ sources, scenes }: { sources: SourceFile[]; scenes: SceneOption[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState(scenes[0]?.id ?? "");
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(45);
  const [deleteSource, setDeleteSource] = useState(false);
  const [job, setJob] = useState<{ id: string; state: string; error?: string } | null>(null);

  // Seçili kaynak türetilir: silinen ya da kesilen bir dosyada seçim kendiliğinden ilk sıraya döner.
  const selected = picked && sources.some((s) => s.name === picked) ? picked : (sources[0]?.name ?? null);

  // Kesme işi bitene kadar durumu yokla.
  useEffect(() => {
    if (!job || ["completed", "failed"].includes(job.state)) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/admin/media-job/${job.id}`);
      if (!res.ok) return;
      const d = (await res.json()) as { state: string; failedReason?: string };
      setJob((j) => (j ? { ...j, state: d.state, error: d.failedReason } : j));
      if (d.state === "completed") router.refresh();
    }, 2000);
    return () => clearInterval(t);
  }, [job, router]);

  function upload(file: File) {
    setError(null);
    setUploading(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/sources?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => e.lengthComputable && setUploading(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setUploading(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        router.refresh();
      } else {
        try {
          setError((JSON.parse(xhr.responseText) as { error?: string }).error ?? `Yükleme başarısız (HTTP ${xhr.status}).`);
        } catch {
          setError(`Yükleme başarısız (HTTP ${xhr.status}). ${xhr.responseText.trim().slice(0, 160)}`);
        }
      }
    };
    xhr.onerror = () => {
      setUploading(null);
      setError("Bağlantı koptu. Sunucu yeniden başlamış olabilir; sayfayı yenileyip tekrar dene.");
    };
    xhr.send(file);
  }

  async function trim() {
    setError(null);
    const res = await fetch("/api/admin/sources/trim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceName: selected, sceneId, start, duration, deleteSource }),
    });
    const d = (await res.json()) as { jobId?: string; error?: string };
    if (!res.ok || !d.jobId) {
      setError(d.error ?? "Kesme başlatılamadı.");
      return;
    }
    setJob({ id: d.jobId, state: "waiting" });
  }

  const scene = scenes.find((s) => s.id === sceneId);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold">Kaynak yükle</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Uzun videoyu bir kez yükle, üstünden istediğin kadar sahne kes. Kaynak geçicidir; kesme sırasında ya da en geç 24 saat içinde silinir.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="video/mp4,video/quicktime,video/x-matroska,video/webm,video/x-msvideo"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="btn btn-primary mt-4" disabled={uploading !== null} onClick={() => fileInput.current?.click()}>
          {uploading !== null ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          {uploading !== null ? `Yükleniyor %${uploading}` : "Video seç"}
        </button>
        {uploading !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${uploading}%` }} />
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
            {error}
          </p>
        )}
      </div>

      {sources.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft">Henüz kaynak yok. Yukarıdan bir video yükle.</div>
      ) : (
        <>
          <ul className="card divide-y divide-line">
            {sources.map((s) => (
              <li key={s.name} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${s.name === selected ? "bg-primary-soft/40" : ""}`}>
                <label className="flex min-w-0 items-center gap-3">
                  <input type="radio" name="source" checked={s.name === selected} onChange={() => setPicked(s.name)} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="text-xs text-ink-faint">
                      {fmt(s.bytes)} · {new Date(s.mtime).toLocaleString("tr-TR")}
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-ghost text-rec"
                  onClick={async () => {
                    if (!window.confirm(`${s.name} silinsin mi?`)) return;
                    await fetch(`/api/admin/sources?name=${encodeURIComponent(s.name)}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  <Trash2 className="size-4" aria-hidden /> Sil
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold">Sahne kes</h2>
              <video
                ref={videoRef}
                key={selected}
                src={`/media/sources/${encodeURIComponent(selected)}`}
                className="mt-3 aspect-video w-full rounded-xl bg-black"
                controls
                preload="metadata"
                playsInline
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setStart(Math.round((videoRef.current?.currentTime ?? 0) * 10) / 10)}>
                  Başlangıcı şu ana ayarla
                </button>
                <button
                  type="button"
                  className="btn btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => {
                    const t = videoRef.current?.currentTime ?? 0;
                    setDuration(Math.max(1, Math.round((t - start) * 10) / 10));
                  }}
                >
                  Bitişi şu ana ayarla
                </button>
                <span className="text-xs text-ink-faint">
                  {hhmmss(start)} → {hhmmss(start + duration)}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" htmlFor="tstart">Başlangıç (sn)</label>
                  <input id="tstart" type="number" min={0} step={0.1} className="input" value={start} onChange={(e) => setStart(Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" htmlFor="tdur">Süre (sn)</label>
                  <input id="tdur" type="number" min={1} max={900} step={0.1} className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" htmlFor="tscene">Hedef sahne</label>
                  <select id="tscene" className="input" value={sceneId} onChange={(e) => setSceneId(e.target.value)}>
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}{s.hasVideo ? " (videosu var)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={deleteSource} onChange={(e) => setDeleteSource(e.target.checked)} />
                Kesme bitince kaynağı sil (bu filmden başka sahne çıkarmayacaksan işaretle)
              </label>

              {scene?.hasVideo && (
                <p className="mt-3 rounded-xl border border-line bg-bg-alt p-3 text-sm text-ink-soft">
                  <strong className="text-ink">{scene.title}</strong> sahnesinin videosu var; kesme onun üzerine yazar.
                </p>
              )}

              <button type="button" className="btn btn-primary mt-4" disabled={!sceneId || (job !== null && !["completed", "failed"].includes(job.state))} onClick={trim}>
                {job && !["completed", "failed"].includes(job.state) ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Scissors className="size-4" aria-hidden />}
                Sahneyi kes
              </button>

              {job && (
                <p className={`mt-3 rounded-xl border p-3 text-sm ${job.state === "failed" ? "border-rec/40 bg-rec/10" : job.state === "completed" ? "border-green/40 bg-green/10" : "border-line bg-bg-alt"}`}>
                  {job.state === "completed"
                    ? "Kesme tamamlandı. Sahne videosu hazır; düzenleme ekranından replikleri işaretleyebilirsin."
                    : job.state === "failed"
                      ? `Kesme başarısız: ${job.error ?? "bilinmeyen hata"}`
                      : "Kesiliyor… Bu ekranı kapatabilirsin, iş arka planda sürer."}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
