"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { SceneCharacter, SceneLine } from "@kngl/shared";

export interface SceneFormValues {
  slug: string;
  title: string;
  source: string;
  description: string;
  durationSeconds: number;
  thumbnailUrl: string;
  isVip: boolean;
  isPublished: boolean;
  characters: SceneCharacter[];
  lines: SceneLine[];
}

const SOURCES = ["Dizi", "Film", "Çizgi film", "Komedi", "Reklam", "Efsane an"];
const PALETTE = ["#ff5d73", "#5ea8ff", "#ffb443", "#8f7bff", "#3fd0a8", "#f4d35e", "#a3785a", "#4cc9f0"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

const empty: SceneFormValues = {
  slug: "", title: "", source: "Komedi", description: "", durationSeconds: 45, thumbnailUrl: "", isVip: false, isPublished: true,
  characters: [{ id: "c1", name: "", color: PALETTE[0] }, { id: "c2", name: "", color: PALETTE[1] }],
  lines: [{ id: "l1", characterId: "c1", text: "", start: 0, end: 4 }],
};

export function SceneForm({ sceneId, initial }: { sceneId?: string; initial?: SceneFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<SceneFormValues>(initial ?? empty);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof SceneFormValues>(k: K, val: SceneFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  function addCharacter() {
    const n = v.characters.length + 1;
    set("characters", [...v.characters, { id: `c${Date.now().toString(36)}`, name: "", color: PALETTE[(n - 1) % PALETTE.length] }]);
  }
  function removeCharacter(id: string) {
    if (v.lines.some((l) => l.characterId === id)) {
      setMsg({ kind: "err", text: "Bu role bağlı replikler var; önce onları değiştir." });
      return;
    }
    set("characters", v.characters.filter((c) => c.id !== id));
  }
  function addLine() {
    const last = v.lines[v.lines.length - 1];
    const start = last ? Math.min(v.durationSeconds - 1, last.end + 0.5) : 0;
    set("lines", [...v.lines, { id: `l${Date.now().toString(36)}`, characterId: v.characters[0]?.id ?? "c1", text: "", start, end: Math.min(v.durationSeconds, start + 4) }]);
  }
  function updLine(i: number, patch: Partial<SceneLine>) {
    set("lines", v.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(sceneId ? `/api/admin/scenes/${sceneId}` : "/api/admin/scenes", {
      method: sceneId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; scene?: { id: string } };
    if (!res.ok) {
      setMsg({ kind: "err", text: data.error ?? "Kaydedilemedi." });
      setBusy(false);
      return;
    }
    setMsg({ kind: "ok", text: "Kaydedildi." });
    setBusy(false);
    if (!sceneId && data.scene) router.push(`/admin/sahne/${data.scene.id}`);
    else router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="title">Başlık</label>
          <input id="title" className="input" value={v.title} required maxLength={200} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="slug">Slug (adres)</label>
          <input id="slug" className="input font-mono text-sm" value={v.slug} required pattern="[a-z0-9][a-z0-9-]{1,100}" onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          <p className="mt-1 text-xs text-ink-faint">Video dosyası <code className="font-mono">{v.slug || "slug"}.mp4</code> olur; kaydettikten sonra değiştirirsen videoyu yeniden yükle.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="source">Tür</label>
          <select id="source" className="input" value={v.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="desc">Açıklama</label>
          <textarea id="desc" className="input min-h-20" value={v.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="dur">Süre (saniye)</label>
          <input id="dur" type="number" min={1} max={900} className="input" value={v.durationSeconds} onChange={(e) => set("durationSeconds", Number(e.target.value))} />
        </div>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Yayında</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.isVip} onChange={(e) => set("isVip", e.target.checked)} /> Plus sahnesi</label>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Roller</h2>
          <button type="button" className="btn btn-secondary px-3 py-1.5 text-xs" onClick={addCharacter} disabled={v.characters.length >= 8}>
            <Plus className="size-3.5" aria-hidden /> Rol ekle
          </button>
        </div>
        <ul className="space-y-2">
          {v.characters.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2">
              <input type="color" value={c.color} aria-label="Renk" className="size-9 cursor-pointer rounded-lg border border-line bg-transparent" onChange={(e) => set("characters", v.characters.map((x) => (x.id === c.id ? { ...x, color: e.target.value } : x)))} />
              <input className="input" placeholder={`Rol ${i + 1} adı`} value={c.name} required maxLength={40} onChange={(e) => set("characters", v.characters.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} />
              <button type="button" className="btn btn-ghost px-2 text-rec" aria-label="Rolü sil" onClick={() => removeCharacter(c.id)} disabled={v.characters.length <= 1}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Replikler</h2>
          <button type="button" className="btn btn-secondary px-3 py-1.5 text-xs" onClick={addLine} disabled={v.lines.length >= 60}>
            <Plus className="size-3.5" aria-hidden /> Replik ekle
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-faint">Başlangıç ve bitiş saniyeleri videodaki konuşma aralığıdır; oyuncu bu aralıkta kayıt yapar.</p>
        <ol className="space-y-3">
          {v.lines.map((l, i) => (
            <li key={l.id} className="grid gap-2 rounded-xl border border-line bg-bg-alt p-3 sm:grid-cols-[2rem_9rem_1fr_5rem_5rem_2.5rem] sm:items-center">
              <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
              <select className="input py-2 text-sm" value={l.characterId} onChange={(e) => updLine(i, { characterId: e.target.value })}>
                {v.characters.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
              </select>
              <input className="input py-2 text-sm" placeholder="Replik metni" value={l.text} required maxLength={300} onChange={(e) => updLine(i, { text: e.target.value })} />
              <input type="number" step={0.1} min={0} className="input py-2 text-sm" aria-label="Başlangıç" value={l.start} onChange={(e) => updLine(i, { start: Number(e.target.value) })} />
              <input type="number" step={0.1} min={0} className="input py-2 text-sm" aria-label="Bitiş" value={l.end} onChange={(e) => updLine(i, { end: Number(e.target.value) })} />
              <button type="button" className="btn btn-ghost px-2 text-rec" aria-label="Repliği sil" onClick={() => set("lines", v.lines.filter((_, idx) => idx !== i))} disabled={v.lines.length <= 1}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </section>

      {msg && (
        <p role="status" className={`rounded-xl border p-3 text-sm ${msg.kind === "ok" ? "border-green/40 bg-green/10" : "border-rec/40 bg-rec/10"}`}>
          {msg.text}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} {sceneId ? "Kaydet" : "Sahneyi oluştur"}
        </button>
      </div>
    </form>
  );
}
