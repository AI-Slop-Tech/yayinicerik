import type { Metadata } from "next";
import Link from "next/link";
import { SceneGrid } from "@/components/scene-card";
import { SCENE_SOURCES, listScenes } from "@/lib/scenes";

export const metadata: Metadata = {
  title: "Sahne kataloğu",
  description: "Lisanslı ve kendi yapımımız kısa sahneler. Rol sayısına, türe ve süreye göre filtrele.",
};
export const dynamic = "force-dynamic";

type Search = { source?: string; characters?: string; q?: string; sort?: string };

function buildHref(current: Search, patch: Partial<Search>) {
  const p = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `/sahneler?${qs}` : "/sahneler";
}

export default async function ScenesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const characters = sp.characters ? Number(sp.characters) : undefined;
  const sort = (["popular", "new", "short"] as const).find((s) => s === sp.sort) ?? "popular";
  const source = SCENE_SOURCES.find((s) => s === sp.source);
  const q = sp.q?.trim() || undefined;
  const scenes = await listScenes({ source, characters, q, sort });

  return (
    <div className="container-x py-12">
      <p className="eyebrow mb-2">Katalog</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Sahne kataloğu</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Kartın köşesindeki sayı rol sayısıdır. Ekibini ona göre topla; fazlası seyirci olur, eksikse biri iki rol alır.
      </p>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/sahneler" method="get">
        {sp.source && <input type="hidden" name="source" value={sp.source} />}
        {sp.characters && <input type="hidden" name="characters" value={sp.characters} />}
        <input name="q" defaultValue={q} className="input sm:max-w-sm" placeholder="Sahne ara…" aria-label="Sahne ara" />
        <select name="sort" defaultValue={sort} className="input sm:w-48" aria-label="Sırala">
          <option value="popular">En çok oynanan</option>
          <option value="new">En yeni</option>
          <option value="short">En kısa</option>
        </select>
        <button className="btn btn-secondary" type="submit">
          Uygula
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={buildHref(sp, { source: "" })} className={`chip ${!source ? "border-primary text-primary" : ""}`}>
          Hepsi
        </Link>
        {SCENE_SOURCES.map((s) => (
          <Link key={s} href={buildHref(sp, { source: s })} className={`chip ${source === s ? "border-primary text-primary" : ""}`}>
            {s}
          </Link>
        ))}
        <span className="mx-2 hidden self-center text-ink-faint sm:inline">·</span>
        {[1, 2, 3, 4].map((n) => (
          <Link
            key={n}
            href={buildHref(sp, { characters: characters === n ? "" : String(n) })}
            className={`chip ${characters === n ? "border-accent text-accent" : ""}`}
          >
            {n === 4 ? "4+" : n} rol
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <SceneGrid scenes={scenes} priorityCount={8} />
      </div>
    </div>
  );
}
