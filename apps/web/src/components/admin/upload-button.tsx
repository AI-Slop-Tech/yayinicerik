"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";

/**
 * Ham gövdeyle (multipart değil) XHR yükleme: ilerleme yüzdesi gösterir, sunucu diske akış halinde yazar.
 */
export function UploadButton({
  url,
  accept,
  label,
  onDone,
  className = "btn btn-secondary",
}: {
  url: string;
  accept: string;
  label: string;
  onDone?: (result: unknown) => void;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function start(file: File) {
    setState("busy");
    setError(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* gövde JSON değil */
        }
        const jobId = (body as { jobId?: string } | null)?.jobId;
        if (jobId) {
          // Sunucu videoyu arka planda küçültüyor; iş bitene kadar bekle.
          setState("processing");
          void waitForJob(jobId, () => {
            setState("done");
            onDone?.(body);
          }, (msg) => {
            setError(msg);
            setState("error");
          });
        } else {
          setState("done");
          setProgress(100);
          onDone?.(body);
        }
      } else {
        let msg = `Yükleme başarısız (HTTP ${xhr.status}).`;
        try {
          msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg;
        } catch {
          // Gövde JSON değil: ham yanıtın başını göster, sorunu kestirmek kolaylaşsın.
          const raw = xhr.responseText.trim().slice(0, 160);
          if (raw) msg = `${msg} ${raw}`;
        }
        setError(msg);
        setState("error");
      }
    };
    xhr.onerror = () => {
      setError("Bağlantı koptu. Sunucu yeniden başlamış olabilir; sayfayı yenileyip tekrar dene. Sürerse yönetim panelindeki disk kutusuna bak.");
      setState("error");
    };
    xhr.ontimeout = () => {
      setError("İstek zaman aşımına uğradı.");
      setState("error");
    };
    xhr.send(file);
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f);
          e.target.value = "";
        }}
      />
      <button type="button" className={className} disabled={state === "busy" || state === "processing"} onClick={() => input.current?.click()}>
        {state === "busy" || state === "processing" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : state === "done" ? (
          <Check className="size-4 text-green" aria-hidden />
        ) : (
          <Upload className="size-4" aria-hidden />
        )}
        {state === "processing" ? "Küçültülüyor…" : state === "busy" && progress !== null ? `Yükleniyor %${progress}` : label}
      </button>
      {(state === "busy" || state === "processing") && progress !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-rec">
          {error}
        </p>
      )}
    </div>
  );
}

/** Sunucudaki yeniden kodlama işini bitene kadar yoklar. */
async function waitForJob(jobId: string, onDone: () => void, onError: (msg: string) => void): Promise<void> {
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`/api/admin/media-job/${jobId}`);
    if (!res.ok) continue;
    const d = (await res.json()) as { state: string; failedReason?: string };
    if (d.state === "completed") return onDone();
    if (d.state === "failed") return onError(d.failedReason ?? "Video işlenemedi.");
  }
  onError("İşlem zaman aşımına uğradı; sayfayı yenileyip kontrol et.");
}
