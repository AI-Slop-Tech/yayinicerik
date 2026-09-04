import Link from "next/link";
import { ArrowRight, KeyRound, Mic, ShieldCheck, Smartphone, Timer } from "lucide-react";
import { SceneGrid } from "@/components/scene-card";
import { SectionHeading } from "@/components/section-heading";
import { Waveform } from "@/components/waveform";
import { RotatingWords } from "@/components/rotating-words";
import { Steps } from "@/components/steps";
import { PricingPanel } from "@/components/pricing";
import { FeaturedPremiere } from "@/components/dub-of-the-day";
import { CommunityCta } from "@/components/community-cta";
import { listNewScenes, listPopularScenes, countScenes } from "@/lib/scenes";
import { getDubOfTheDay, countDubs } from "@/lib/dubs";

/**
 * Ana sayfa: veriler önbellekten (süreç içi + Redis) gelir; DB'ye dakikada bir kez gidilir.
 * nginx katmanı ayrıca anonim HTML'i mikro-önbelleğe alır.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [popular, fresh, premiere, sceneCount, dubCount] = await Promise.all([
    listPopularScenes(8),
    listNewScenes(4),
    getDubOfTheDay(),
    countScenes(),
    countDubs(),
  ]);
  const ticker = [...popular, ...fresh].map((s) => s.title);

  return (
    <>
      {/* HERO: sol metin, sağ "kura kartı" destesi */}
      <section className="relative overflow-hidden">
        <div className="bg-paper absolute inset-0 -z-10" />
        <div className="container-x grid items-center gap-14 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <div>
            <p className="eyebrow mb-4">Ekip oyunu · tarayıcıda · ücretsiz</p>
            <h1 className="font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Rolünü çek.
              <br />
              Sesini ver.
              <br />
              <span className="text-primary">Prömiyeri birlikte izle.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft leading-relaxed">
              Bu akşam ekibinle <RotatingWords /> seslendirin. Roller kura ile dağıtılır, herkes kendi repliğini kaydeder,
              sonunda tek bir video çıkar. Kim kimi seslendirdi, prömiyere kadar sır.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/oda-olustur" className="btn btn-primary px-7 py-3.5 text-base">
                <Mic className="size-5" aria-hidden /> Ekip kur
              </Link>
              <Link href="/katil" className="btn btn-secondary px-7 py-3.5 text-base">
                <KeyRound className="size-5" aria-hidden /> Kodum var
              </Link>
            </div>
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              {[
                { icon: Smartphone, t: "Uygulama yok", d: "Telefon tarayıcısı yeter" },
                { icon: Timer, t: "10 dakika", d: "Kurulumdan prömiyere" },
                { icon: ShieldCheck, t: "Lisanslı sahneler", d: `${sceneCount} sahne, ${dubCount.toLocaleString("tr-TR")} prömiyer` },
              ].map((f) => (
                <li key={f.t}>
                  <f.icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 font-semibold">{f.t}</p>
                  <p className="text-xs text-ink-faint">{f.d}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Kura kartı destesi */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-hidden="true">
            <div className="absolute inset-x-6 top-4 h-full rotate-[4deg] rounded-[22px] bg-accent-soft" />
            <div className="absolute inset-x-3 top-2 h-full rotate-[2deg] rounded-[22px] bg-primary-soft" />
            <div className="card relative p-6 shadow-card sm:p-7">
              <div className="flex items-center justify-between text-xs">
                <span className="chip">Ekip kodu · <span className="font-mono font-bold text-ink">N4KQ7W</span></span>
                <span className="text-ink-faint">4 / 4 hazır</span>
              </div>
              <p className="mt-6 text-xs font-semibold tracking-[0.18em] uppercase text-ink-faint">Senin rolün</p>
              <p className="font-display text-3xl font-extrabold text-primary">Dedektif Pamuk</p>
              <p className="mt-1 text-sm text-ink-soft">Kedi Dedektif: Kayıp balık · 2 replik</p>
              <div className="mt-5 space-y-2.5">
                <div className="rounded-xl border border-primary/40 bg-primary-soft/60 p-3.5">
                  <p className="text-[11px] font-semibold text-primary">0:06 · SIRA SENDE</p>
                  <p className="mt-1 text-sm">Kimse odadan çıkmasın. Bu balığı bulacağım. Muhtemelen içimde.</p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-3.5 opacity-70">
                  <p className="text-[11px] font-semibold text-ink-faint">0:12 · ??? </p>
                  <p className="mt-1 text-sm blur-[3px] select-none">Ben yapmadım! Ben sadece kokladım. Çok. Uzun süre.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <Waveform bars={20} className="h-8 text-primary" />
                <span className="btn btn-rec pointer-events-none px-4 py-2">
                  <span className="size-2 rounded-full bg-white animate-pulse-rec" /> 3 · 2 · 1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kayan sahne şeridi */}
        <div className="border-y border-line bg-surface py-3 overflow-hidden" aria-hidden="true">
          <div className="flex w-max gap-10 whitespace-nowrap animate-ticker text-sm font-semibold text-ink-soft">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                {t} <span className="size-1.5 rounded-full bg-primary" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* KATALOG */}
      <section className="container-x pt-16">
        <SectionHeading
          eyebrow="Katalog"
          title="Bu hafta en çok oynananlar"
          description="Sayı, sahnede kaç rol olduğunu gösterir. Ekibin daha kalabalıksa fazlası seyirci olur; daha azsa biri iki rol alır."
          href="/sahneler"
          hrefLabel="Kataloğu aç"
        />
        <SceneGrid scenes={popular} priorityCount={4} />
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span>Yeni eklenenler:</span>
          {fresh.map((s) => (
            <Link key={s.id} href={`/sahne/${s.slug}`} className="chip hover:border-primary hover:text-primary">
              {s.title}
            </Link>
          ))}
        </div>
      </section>

      {/* NASIL İŞLER */}
      <section className="container-x py-20" id="nasil-isler">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-2">Nasıl işler</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Bir sahne, dört adım, tek prömiyer.</h2>
            <p className="mt-3 text-ink-soft leading-relaxed">
              Kayıt sırasında kimse kimseyi duymaz. Sesler yalnızca final videoda buluşur; onu da ilk kez birlikte izlersiniz.
            </p>
            <Link href="/nasil-oynanir" className="btn btn-secondary mt-6">
              Ayrıntılı rehber <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <Steps />
        </div>
      </section>

      {/* PRÖMİYER */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container-x">
          <FeaturedPremiere dub={premiere} />
        </div>
      </section>

      {/* PLUS */}
      <section className="container-x py-20" id="plus">
        <SectionHeading
          eyebrow="Üyelik"
          title="Ücretsiz oyna. İstersen Plus."
          description="Ücretsiz plan oyunun tamamını içerir. Plus, prömiyeri hızlandırır, imzasız 1080p verir ve ekibi büyütür."
        />
        <PricingPanel />
      </section>

      {/* TOPLULUK + ÖNERİ */}
      <section className="container-x pb-4">
        <CommunityCta />
      </section>
    </>
  );
}
