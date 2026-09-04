import { DoorOpen, Shuffle, Mic, Clapperboard } from "lucide-react";

export const STEPS = [
  {
    icon: DoorOpen,
    title: "Oda kur",
    text: "Kaç kişiyseniz o kadar kişilik bir oda aç, altı haneli kodu gönder. Kurulum yok, tarayıcı yeter.",
  },
  {
    icon: Shuffle,
    title: "Karakterini al",
    text: "Sunucu karakterleri rastgele dağıtır. Kim kimi seslendiriyor, final videoya kadar sürpriz.",
  },
  {
    icon: Mic,
    title: "Repliklerini kaydet",
    text: "Sahneyi izle, sıran gelince kaydet. Beğenmedin mi? Tekrar al. Kimse seni duymuyor.",
  },
  {
    icon: Clapperboard,
    title: "Birlikte izle",
    text: "Bütün kayıtlar tek videoda birleşir. Herkes final kesimi aynı anda, ilk kez görür.",
  },
];

export function Steps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {STEPS.map((s, i) => (
        <li key={s.title} className="card relative overflow-hidden p-6">
          <span className="absolute -right-3 -top-5 font-display text-7xl font-black text-white/[0.04] select-none">
            0{i + 1}
          </span>
          <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <s.icon className="size-5" aria-hidden />
          </span>
          <p className="mb-1 text-xs font-semibold tracking-widest text-ink-faint">ADIM 0{i + 1}</p>
          <h3 className="font-display text-lg font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
