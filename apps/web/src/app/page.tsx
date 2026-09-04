import Link from "next/link";
import { ArrowRight, KeyRound, Mic, Sparkles } from "lucide-react";
import { SceneGrid } from "@/components/scene-card";
import { SectionHeading } from "@/components/section-heading";
import { Waveform } from "@/components/waveform";
import { RotatingWords } from "@/components/rotating-words";
import { Steps } from "@/components/steps";
import { PricingCards } from "@/components/pricing";
import { DubOfTheDay } from "@/components/dub-of-the-day";
import { CommunityCta } from "@/components/community-cta";
import { listNewScenes, listPopularScenes, countScenes } from "@/lib/scenes";
import { getDubOfTheDay, countDubs } from "@/lib/dubs";

/**
 * Ana sayfa: veriler önbellekten (süreç içi + Redis) gelir; DB'ye dakikada bir kez gidilir.
 * nginx katmanı ayrıca anonim HTML'i mikro-önbelleğe alır.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [popular, fresh, dub, sceneCount, dubCount] = await Promise.all([
    listPopularScenes(8),
    listNewScenes(4),
    getDubOfTheDay(),
    countScenes(),
    countDubs(),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10" />
        <div className="absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_180_67/0.16),transparent)]" />
        <div className="container-x grid items-center gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-28">
          <div>
            <p className="chip mb-5">
              <span className="size-1.5 rounded-full bg-rec animate-pulse-rec" /> Çok oyunculu dublaj oyunu
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Sahneyi seslendir.
              <br />
              <span className="text-ink-soft">Arkadaşlarınla.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft leading-relaxed">
              Bu akşam <RotatingWords /> birlikte dublajlayın. Karakterini al, repliklerini kaydet; herkesin sesi tek
              bir final videoda birleşsin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/oda-olustur" className="btn btn-primary px-7 py-3.5 text-base">
                <Mic className="size-5" aria-hidden /> Oda kur
              </Link>
              <Link href="/katil" className="btn btn-secondary px-7 py-3.5 text-base">
                <KeyRound className="size-5" aria-hidden /> Kodla katıl
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-8 text-sm">
              <div>
                <dt className="text-ink-faint">Sahne</dt>
                <dd className="font-display text-2xl font-bold">{sceneCount}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Üretilen dublaj</dt>
                <dd className="font-display text-2xl font-bold">{dubCount.toLocaleString("tr-TR")}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Kurulum</dt>
                <dd className="font-display text-2xl font-bold">Yok</dd>
              </div>
            </dl>
          </div>

          {/* Stüdyo kartı */}
          <div className="card relative p-6 sm:p-8 shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rec animate-pulse-rec" /> KAYIT
              </span>
              <span className="font-mono">00:00.000 / 00:42.000</span>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { who: "Deniz", color: "#ff5d73", text: "O simit benim. Dün gece rüyamda gördüm.", you: true },
                { who: "Ege", color: "#5ea8ff", text: "Rüya görmek mülkiyet hakkı vermez Deniz." },
                { who: "Deniz", color: "#ff5d73", text: "Annem sana dedi ki 'kardeşine bırak'. Duydum.", you: true },
              ].map((l, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3.5 text-sm ${l.you ? "border-primary/40 bg-primary/5" : "border-line bg-bg-alt"}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: l.color }} />
                    <span className="font-semibold">{l.who}</span>
                    {l.you && <span className="chip py-0 text-[10px] text-primary">SEN</span>}
                  </div>
                  <p className="text-ink">{l.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Waveform bars={22} className="text-primary h-8" />
              <span className="btn btn-rec pointer-events-none px-4 py-2">
                <Mic className="size-4" aria-hidden /> Kaydet
              </span>
            </div>
            <span className="absolute -left-4 -top-4 hidden rounded-full border border-line bg-surface px-3 py-1.5 text-xs shadow-card sm:block">
              Oda <span className="font-mono font-bold text-primary">K7X2PQ</span>
            </span>
          </div>
        </div>
      </section>

      {/* NASIL OYNANIR */}
      <section className="container-x py-16" id="nasil-oynanir">
        <SectionHeading
          eyebrow="Nasıl oynanır"
          title="Dört adım, tek oturuş."
          description="Kayıt sırasında kimse kimseyi duymaz. Sesler yalnızca final videoda bir araya gelir; onu da ilk kez birlikte izlersiniz."
          href="/nasil-oynanir"
          hrefLabel="Ayrıntılı rehber"
        />
        <Steps />
      </section>

      {/* POPÜLER SAHNELER */}
      <section className="container-x py-16">
        <SectionHeading
          eyebrow="Oyna"
          title="Bir sahne seç."
          description="Her sahne kaç karakteri olduğunu söyler; odanı o sayıya göre kur."
          href="/sahneler"
        />
        <SceneGrid scenes={popular} priorityCount={4} />
      </section>

      {/* YENİ SAHNELER */}
      <section className="container-x py-16">
        <SectionHeading
          eyebrow="Yeni eklendi"
          title="Taze sahneler."
          description="Katalog her hafta büyüyor. En son eklenenler burada."
          href="/sahneler?sort=new"
          hrefLabel="Yenileri gör"
        />
        <SceneGrid scenes={fresh} />
      </section>

      {/* FİYATLANDIRMA */}
      <section className="container-x py-16" id="vip">
        <SectionHeading
          eyebrow="Fiyatlandırma"
          title="Daha hızlı, daha keskin dublaj."
          description="Ücretsiz oynamaya devam et. VIP, render işini kuyruğun önüne alır ve filigransız 1080p teslim eder."
        />
        <PricingCards />
      </section>

      {/* GÜNÜN DUBLAJI */}
      <section className="container-x py-16">
        <SectionHeading
          eyebrow="Öne çıkan"
          title="Bugün ne çıktı?"
          description="Seçtiğimiz bir oyun. Videodaki her ses oyunculara ait."
          href="/dublajlar"
          hrefLabel="Tüm dublajlar"
        />
        <DubOfTheDay dub={dub} />
      </section>

      {/* TOPLULUK */}
      <section className="container-x py-16">
        <CommunityCta />
      </section>

      {/* SON CTA */}
      <section className="container-x pt-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Sparkles className="size-6 text-primary" aria-hidden />
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Bu akşamın planı hazır.</h2>
          <p className="max-w-md text-ink-soft">Bir oda aç, kodu gruba at. Gerisi sürpriz.</p>
          <Link href="/oda-olustur" className="btn btn-primary mt-2 px-7 py-3.5 text-base">
            Oda kur <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
