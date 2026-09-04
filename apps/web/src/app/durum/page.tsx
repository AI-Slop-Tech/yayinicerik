import type { Metadata } from "next";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export const metadata: Metadata = { title: "Sistem durumu", robots: { index: false } };
export const dynamic = "force-dynamic";

async function probe(name: string, fn: () => Promise<unknown>) {
  const t = performance.now();
  try {
    await fn();
    return { name, ok: true, ms: Math.round(performance.now() - t) };
  } catch {
    return { name, ok: false, ms: Math.round(performance.now() - t) };
  }
}

export default async function StatusPage() {
  const results = await Promise.all([
    probe("Web uygulaması", async () => {}),
    probe("Redis (odalar, önbellek)", () => redis().ping()),
    probe("PostgreSQL (katalog)", () => db().query("SELECT 1")),
  ]);
  const allOk = results.every((r) => r.ok);
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-2">Durum</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{allOk ? "Tüm sistemler çalışıyor" : "Kısmi kesinti"}</h1>
        <ul className="card mt-8 divide-y divide-line">
          {results.map((r) => (
            <li key={r.name} className="flex items-center justify-between p-4 text-sm">
              <span>{r.name}</span>
              <span className={`flex items-center gap-2 ${r.ok ? "text-green" : "text-rec"}`}>
                <span className={`size-2 rounded-full ${r.ok ? "bg-green" : "bg-rec"}`} />
                {r.ok ? `Çalışıyor · ${r.ms} ms` : "Yanıt yok"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
