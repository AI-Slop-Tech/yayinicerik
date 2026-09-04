import { UsersRound, Dices, Mic, Popcorn } from "lucide-react";

export const STEPS = [
  {
    icon: UsersRound,
    title: "Ekibini topla",
    text: "Bir sahne seç, ekip kodunu gruba at. Herkes telefonundan girer; uygulama yok.",
    aside: "1–8 kişi",
  },
  {
    icon: Dices,
    title: "Rolünü çek",
    text: "Roller kura ile dağıtılır. Sen yalnızca kendi rolünü görürsün; diğerleri sona kadar sır.",
    aside: "Kura otomatik",
  },
  {
    icon: Mic,
    title: "Sesini ver",
    text: "Sahnedeki repliğini izle, geri sayımı bekle, kaydet. Beğenmezsen üstüne al.",
    aside: "Sınırsız tekrar",
  },
  {
    icon: Popcorn,
    title: "Prömiyer",
    text: "Bütün kayıtlar sahneye işlenir. Videoyu herkes aynı anda, ilk kez izler.",
    aside: "≈ 1 dakika",
  },
];

/** Dikey zaman çizelgesi: adımlar yukarıdan aşağı akar, numaralar çizgi üzerinde durur. */
export function Steps() {
  return (
    <ol className="relative ml-3 border-l-2 border-line pl-8 sm:ml-6 sm:pl-12">
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative pb-10 last:pb-0">
          <span className="absolute -left-[calc(2rem+1.25rem+1px)] top-0 flex size-10 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-white ring-4 ring-bg sm:-left-[calc(3rem+1.25rem+1px)]">
            {i + 1}
          </span>
          <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <s.icon className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{s.text}</p>
            </div>
            <span className="chip self-start">{s.aside}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
