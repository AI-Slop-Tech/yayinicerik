import Link from "next/link";
import { Check, Crown, Zap } from "lucide-react";

const rows: Array<{ label: string; free: string; vip: string }> = [
  { label: "Render sırası", free: "Normal", vip: "Öncelikli (hızlı)" },
  { label: "Video kalitesi", free: "720p", vip: "1080p" },
  { label: "Filigran", free: "KNGL Dublaj", vip: "Yok" },
  { label: "Ses değiştirici", free: "Temel", vip: "Profesyonel" },
  { label: "Sahne kataloğu", free: "Standart", vip: "Standart + VIP sahneler" },
  { label: "Oda başına oyuncu", free: "6", vip: "8" },
  { label: "Dublaj arşivi", free: "30 gün", vip: "Süresiz" },
];

export function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-7">
        <p className="eyebrow text-ink-faint mb-2">Ücretsiz</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold">₺0</span>
          <span className="text-ink-faint text-sm">her zaman</span>
        </div>
        <p className="mt-3 text-sm text-ink-soft">Oynamak için yeterli olan her şey. Kart bilgisi istemez.</p>
        <ul className="mt-6 space-y-3 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-4 border-b border-line/60 pb-3 last:border-0">
              <span className="text-ink-soft">{r.label}</span>
              <span className="font-medium">{r.free}</span>
            </li>
          ))}
        </ul>
        <Link href="/oda-olustur" className="btn btn-secondary mt-7 w-full">
          Ücretsiz oyna
        </Link>
      </div>

      <div className="card relative overflow-hidden p-7 border-primary/40 shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative">
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <Crown className="size-3.5" aria-hidden /> KNGL VIP
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold">₺99</span>
            <span className="text-ink-faint text-sm">/ 30 gün</span>
          </div>
          <p className="mt-3 text-sm text-ink-soft">Render kuyruğunun önüne geç, filigransız 1080p indir.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-4 border-b border-line/60 pb-3 last:border-0">
                <span className="text-ink-soft">{r.label}</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="size-3.5 text-primary" aria-hidden /> {r.vip}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/fiyatlandirma" className="btn btn-primary mt-7 w-full">
            <Zap className="size-4" aria-hidden /> VIP ol
          </Link>
        </div>
      </div>
    </div>
  );
}
