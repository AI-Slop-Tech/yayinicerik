"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function SuggestForm() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    const res = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, url, note }) });
    if (res.ok) {
      setState("done");
    } else {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Gönderilemedi.");
      setState("error");
    }
  }

  if (state === "done") {
    return <div className="card p-8 text-center">Teşekkürler! Önerin lisans ekibine iletildi.</div>;
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Sahne / yapım adı
        </label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>
      <div>
        <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
          Bağlantı (isteğe bağlı)
        </label>
        <input id="url" type="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </div>
      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
          Not
        </label>
        <textarea id="note" className="input min-h-28" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Hangi an, kaç karakter, neden eğlenceli?" />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={state === "busy"}>
        {state === "busy" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        Gönder
      </button>
    </form>
  );
}
