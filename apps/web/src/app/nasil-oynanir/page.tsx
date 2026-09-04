import type { Metadata } from "next";
import Link from "next/link";
import { Steps } from "@/components/steps";

export const metadata: Metadata = {
  title: "Nasıl oynanır",
  description: "Oda kur, kodu paylaş, karakterini al, repliklerini kaydet, final videoyu birlikte izle.",
};

const FAQ = [
  {
    q: "Kaç kişi oynayabiliriz?",
    a: "Sahnedeki karakter sayısı kadar oyuncu ideal. Daha az kişiyseniz bazı oyuncular birden fazla karakter alır; daha fazla kişiyseniz kalanlar seyirci olur ve final videoyu sizinle aynı anda izler.",
  },
  {
    q: "Kayıt için ne gerekli?",
    a: "Güncel bir tarayıcı ve mikrofon. Uygulama indirmeye gerek yok; telefon, tablet ve bilgisayarda çalışır.",
  },
  {
    q: "Kaydımı beğenmezsem?",
    a: "Her repliği istediğin kadar tekrar kaydedebilirsin. Sadece son kayıt final videoya girer.",
  },
  {
    q: "Diğer oyuncular kaydımı duyar mı?",
    a: "Hayır. Kayıt sırasında kimse kimseyi duymaz. Sesler yalnızca final videoda bir araya gelir.",
  },
  {
    q: "Final video ne kadar sürede hazır olur?",
    a: "Genellikle bir dakikadan kısa. VIP üyelerin işleri kuyruğun önüne alınır.",
  },
  {
    q: "Videoyu indirebilir miyim?",
    a: "Evet. Ücretsiz planda 720p ve KNGL Dublaj filigranı bulunur; VIP'de 1080p ve filigransız.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="container-x py-12">
      <p className="eyebrow mb-2">Rehber</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Nasıl oynanır?</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Dört adım, tek oturuş. Kayıt sırasında kimse kimseyi duymaz; sürpriz final videoda.
      </p>
      <div className="mt-10">
        <Steps />
      </div>

      <section className="mt-16 grid gap-5 md:grid-cols-3">
        {[
          { t: "Sessiz bir köşe bul", d: "Arka plan gürültüsü ses değiştiriciyi zorlar. Kulaklık kullanmak yankıyı azaltır." },
          { t: "Repliği bir kez izle", d: "Sıra sende olduğunda kayıt otomatik başlamaz; önce sahneyi dinle, sonra kaydet." },
          { t: "Abartmaktan korkma", d: "En iyi dublajlar, karakterin sesini en çok değiştirenlerden çıkıyor." },
        ].map((tip) => (
          <div key={tip.t} className="card p-6">
            <h3 className="font-display font-semibold">{tip.t}</h3>
            <p className="mt-2 text-sm text-ink-soft">{tip.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight">Sık sorulanlar</h2>
        <div className="mt-6 divide-y divide-line card">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between gap-4">
                {f.q}
                <span className="text-ink-faint transition group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <Link href="/oda-olustur" className="btn btn-primary px-7 py-3.5 text-base">
          Hemen bir oda kur
        </Link>
      </div>
    </div>
  );
}
