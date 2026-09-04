import type { Metadata } from "next";
import Link from "next/link";
import { Steps } from "@/components/steps";

export const metadata: Metadata = {
  title: "Nasıl işler",
  description: "Ekibini topla, rolünü çek, sesini ver, prömiyeri birlikte izle. Sık sorulan sorular.",
};

const FAQ = [
  {
    q: "Kaç kişi gerekir?",
    a: "Sahnedeki rol sayısı kadar oyuncu idealdir. Daha az kişiyseniz kura bazı oyunculara iki rol verir; daha kalabalıksanız fazlası seyirci olur ve prömiyeri ekiple aynı anda izler.",
  },
  {
    q: "Ne indirmem gerekiyor?",
    a: "Hiçbir şey. Güncel bir tarayıcı ve mikrofon izni yeterli. Telefon, tablet ve bilgisayarda çalışır.",
  },
  {
    q: "Kaydımı beğenmezsem?",
    a: "İstediğin kadar tekrar alabilirsin. Yalnızca 'Bunu kullan' dediğin son kayıt prömiyere girer.",
  },
  {
    q: "Ekiptekiler kaydımı duyar mı?",
    a: "Hayır. Kayıt sırasında kimse kimseyi duymaz; sesler yalnızca final videoda buluşur. Sürpriz bu yüzden var.",
  },
  {
    q: "Prömiyer ne kadar sürede hazır olur?",
    a: "Çoğunlukla bir dakikadan kısa. Plus üyelerinin videoları kuyrukta öne alınır.",
  },
  {
    q: "Videoyu indirebilir miyim?",
    a: "Evet. Ücretsiz planda 720p ve küçük bir KNGL imzası olur; Plus'ta 1080p ve imzasız.",
  },
  {
    q: "Sahneler nereden geliyor?",
    a: "Katalogdaki her sahne ya kendi yapımımız ya da lisansını aldığımız içeriklerden kesilir. Kaynağı sahne sayfasında belirtiriz.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-x py-12">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2">Rehber</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Nasıl işler?</h1>
        <p className="mt-3 text-ink-soft leading-relaxed">
          Bir sahne, dört adım, tek prömiyer. Aşağıda akışın tamamı ve en çok sorulanlar.
        </p>
      </div>
      <div className="mt-12 max-w-3xl">
        <Steps />
      </div>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        {[
          { t: "Kulaklık tak", d: "Hoparlör sesi mikrofona karışırsa replik bulanıklaşır. Kulaklık yankıyı keser." },
          { t: "Önce izle, sonra kaydet", d: "Geri sayım başlamadan önce sahneyi bir kez izle; tempoyu yakalamak kolaylaşır." },
          { t: "Abart", d: "En çok izlenen prömiyerler, karakterin sesini en cesur değiştirenlerden çıkıyor." },
        ].map((tip) => (
          <div key={tip.t} className="card p-6">
            <h3 className="font-display text-lg font-bold">{tip.t}</h3>
            <p className="mt-2 text-sm text-ink-soft">{tip.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 max-w-3xl">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Sık sorulanlar</h2>
        <div className="card mt-6 divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl leading-none text-ink-faint transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <Link href="/oda-olustur" className="btn btn-primary px-7 py-3.5 text-base">
          Ekip kur
        </Link>
      </div>
    </div>
  );
}
