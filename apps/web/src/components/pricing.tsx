import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const PLUS_PERKS = [
  { t: "Kuyrukta öncelik", d: "Prömiyer videon önce işlenir." },
  { t: "1080p, imzasız indirme", d: "Ücretsiz planda 720p ve KNGL imzası vardır." },
  { t: "10 kişilik ekip", d: "Ücretsiz planda 6." },
  { t: "Süresiz arşiv", d: "Ücretsiz planda 30 gün." },
  { t: "Plus sahneleri", d: "Yalnızca üyelere açılan uzun sahneler." },
  { t: "Ses efektleri", d: "Yankı, telsiz, dev ve daha fazlası." },
];

/** Tek panel: solda karar bilgisi, sağda Plus'ın ne kattığı. Ücretsiz plan tabloya değil cümleye sığar. */
export function PricingPanel() {
  return (
    <div className="card overflow-hidden lg:grid lg:grid-cols-[1fr_1.2fr]">
      <div className="bg-accent p-8 text-white sm:p-10">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] uppercase text-white/70">
          <Sparkles className="size-3.5" aria-hidden /> KNGL Plus
        </p>
        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold leading-none">₺79</span>
          <span className="text-white/70">/ ay</span>
        </div>
        <p className="mt-4 max-w-xs text-white/80 leading-relaxed">
          İstediğin zaman iptal. Ücretsiz plan hep açık kalır; Plus yalnızca daha hızlı, daha net ve daha kalabalık oynamak isteyenler için.
        </p>
        <Link href="/fiyatlandirma" className="btn btn-primary mt-8">
          Plus&apos;a geç
        </Link>
        <p className="mt-6 text-sm text-white/60">
          Ücretsiz plan: 720p video, KNGL imzası, 6 kişilik ekip, 30 gün arşiv. Kart bilgisi istemez.
        </p>
      </div>
      <ul className="grid gap-5 p-8 sm:grid-cols-2 sm:p-10">
        {PLUS_PERKS.map((p) => (
          <li key={p.t} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Check className="size-3.5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">{p.t}</p>
              <p className="text-sm text-ink-soft">{p.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
