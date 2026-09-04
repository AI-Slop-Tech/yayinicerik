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
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
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
        setState("done");
        setProgress(100);
        try {
          onDone?.(JSON.parse(xhr.responseText));
        } catch {
          onDone?.(null);
        }
      } else {
        let msg = `Yükleme başarısız (${xhr.status}).`;
        try {
          msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg;
        } catch {
          /* gövde JSON değil */
        }
        setError(msg);
        setState("error");
      }
    };
    xhr.onerror = () => {
      setError("Bağlantı hatası. Dosya çok büyükse proxy sınırını (client_max_body_size) kontrol et.");
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
      <button type="button" className={className} disabled={state === "busy"} onClick={() => input.current?.click()}>
        {state === "busy" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : state === "done" ? <Check className="size-4 text-green" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {state === "busy" && progress !== null ? `Yükleniyor %${progress}` : label}
      </button>
      {state === "busy" && progress !== null && (
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
