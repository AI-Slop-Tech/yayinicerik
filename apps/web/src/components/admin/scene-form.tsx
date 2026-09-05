"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { LineStudio } from "./line-studio";
import { LICENSE_LABELS, type LicenseType, type SceneCharacter, type SceneLine } from "@kngl/shared";

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
  licenseType: LicenseType;
  licenseSource: string;
  licenseHolder: string;
  licenseNote: string;
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
  licenseType: "unknown", licenseSource: "", licenseHolder: "", licenseNote: "",
};

const LICENSE_HINTS: Record<LicenseType, string> = {
  unknown: "Kaynak belirlenmeden sahne yayına alınamaz.",
  "public-domain": "Telifi dolmuş eser. Kaynağa arşiv bağlantısını yaz (ör. archive.org sayfası).",
  cc: "Creative Commons. Kaynağa bağlantıyı, hak sahibine eser sahibinin adını yaz; atıf sahne sayfasında gösterilir.",
  licensed: "Hak sahibinden izin alındı. Kaynağa sözleşme/izin referansını, hak sahibine şirketin adını yaz.",
  own: "Kendi ürettiğimiz içerik. Kaynak zorunlu değil.",
};

export function SceneForm({
  sceneId,
  initial,
  videoUrl = "",
  hasVideo = false,
}: {
  sceneId?: string;
  initial?: SceneFormValues;
  videoUrl?: string;
  hasVideo?: boolean;
}) {
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
          {hasVideo && <p className="mt-1 text-xs text-ink-faint">Video yüklendiğinde otomatik dolar.</p>}
        </div>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Yayında</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.isVip} onChange={(e) => set("isVip", e.target.checked)} /> Plus sahnesi</label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold">Lisans</h2>
        <p className="mt-1 mb-4 text-xs text-ink-faint">
          Bu sahnenin hangi hakla kullanıldığı. Telif itirazı geldiğinde kaynağı buradan gösterirsin; yayına almak için zorunludur.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="ltype">Tür</label>
            <select id="ltype" className="input" value={v.licenseType} onChange={(e) => set("licenseType", e.target.value as LicenseType)}>
              {(Object.keys(LICENSE_LABELS) as LicenseType[]).map((t) => (
                <option key={t} value={t}>{LICENSE_LABELS[t]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-faint">{LICENSE_HINTS[v.licenseType]}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="lholder">Hak sahibi / eser sahibi</label>
            <input id="lholder" className="input" value={v.licenseHolder} maxLength={200} placeholder="ör. Prelinger Archives" onChange={(e) => set("licenseHolder", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="lsource">Kaynak</label>
            <input id="lsource" className="input" value={v.licenseSource} maxLength={500} placeholder="https://archive.org/details/... ya da sözleşme referansı" onChange={(e) => set("licenseSource", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="lnote">Not</label>
            <textarea id="lnote" className="input min-h-16" value={v.licenseNote} maxLength={1000} placeholder="İzin tarihi, kapsam, yazışma referansı…" onChange={(e) => set("licenseNote", e.target.value)} />
          </div>
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
        <h2 className="font-display text-lg font-bold">Replikler</h2>
        <p className="mt-1 mb-4 text-xs text-ink-faint">
          Videoyu oynat, konuşma başlarken başlangıcı, biterken bitişi işaretle. Oyuncu tam bu aralıkta kayıt yapar.
        </p>
        <LineStudio
          videoUrl={videoUrl}
          hasVideo={hasVideo}
          duration={v.durationSeconds}
          characters={v.characters}
          lines={v.lines}
          onChange={(lines) => set("lines", lines)}
          onDurationDetected={(sec) => setV((s) => (s.durationSeconds === sec ? s : { ...s, durationSeconds: sec }))}
        />
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
