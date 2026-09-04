"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown, Loader2, Mic, Users } from "lucide-react";

interface SceneOption {
  slug: string;
  title: string;
  characterCount: number;
  isVip: boolean;
  source: string;
}

export function CreateRoomForm({
  scenes,
  initialSlug,
  nickname,
  isVip,
}: {
  scenes: SceneOption[];
  initialSlug: string;
  nickname: string | null;
  isVip: boolean;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [nick, setNick] = useState(nickname ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = scenes.find((s) => s.slug === slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneSlug: slug, nickname: nickname ? undefined : nick }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error ?? "Oda kurulamadı.");
      router.push(`/oda/${data.code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8 space-y-6">
      {!nickname && (
        <div>
          <label htmlFor="nick" className="mb-2 block text-sm font-medium">
            Takma adın
          </label>
          <input id="nick" className="input" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="örn. mikrofoncu" maxLength={24} required autoComplete="nickname" />
          <p className="mt-1.5 text-xs text-ink-faint">Diğer oyuncular seni bu adla görür. Kayıt gerekmez.</p>
        </div>
      )}

      <div>
        <p className="mb-2 block text-sm font-medium">Sahne</p>
        <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {scenes.map((s) => {
            const locked = s.isVip && !isVip;
            const active = s.slug === slug;
            return (
              <button
                type="button"
                key={s.slug}
                disabled={locked}
                onClick={() => setSlug(s.slug)}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                  active ? "border-primary bg-primary/10" : "border-line bg-bg-alt hover:border-line-strong"
                } disabled:opacity-50`}
                aria-pressed={active}
              >
                <span>
                  <span className="block font-medium leading-snug">{s.title}</span>
                  <span className="mt-1 block text-xs text-ink-faint">{s.source}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="chip">
                    <Users className="size-3" aria-hidden /> {s.characterCount}
                  </span>
                  {s.isVip && (
                    <span className="chip text-primary">
                      <Crown className="size-3" aria-hidden /> VIP
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {selected && (
          <p className="mt-2 text-xs text-ink-faint">
            {selected.characterCount} karakter. Fazla oyuncular seyirci olur; eksik olursanız bazı oyuncular birden fazla karakter alır.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm text-ink">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full py-3.5 text-base" disabled={busy || !slug}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Mic className="size-5" aria-hidden />}
        Odayı kur
      </button>
    </form>
  );
}
