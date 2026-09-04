import Link from "next/link";
import { BRAND } from "@kngl/shared";
import { Logo } from "./logo";

const groups = [
  {
    title: "Oyun",
    links: [
      { href: "/oda-olustur", label: "Ekip kur" },
      { href: "/katil", label: "Koda katıl" },
      { href: "/sahneler", label: "Sahne kataloğu" },
      { href: "/dublajlar", label: "Prömiyerler" },
      { href: "/nasil-oynanir", label: "Nasıl işler" },
    ],
  },
  {
    title: "Üyelik",
    links: [
      { href: "/giris", label: "Giriş / Kayıt" },
      { href: "/hesabim", label: "Hesabım" },
      { href: "/fiyatlandirma", label: "KNGL Plus" },
      { href: "/sahne-oner", label: "Sahne öner" },
    ],
  },
  {
    title: "Şeffaflık",
    links: [
      { href: "/gizlilik", label: "Gizlilik" },
      { href: "/kullanim-sartlari", label: "Kullanım şartları" },
      { href: "/telif", label: "Lisans ve telif" },
      { href: "/durum", label: "Sistem durumu" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-alt">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-ink-soft leading-relaxed">
              Kısa bir sahne, paylaşılan roller, tek bir prömiyer. Ekibinle tarayıcıdan oynanır.
            </p>
            <a href="mailto:merhaba@kngldublaj.com" className="inline-block text-sm font-medium text-ink hover:text-primary">
              merhaba@kngldublaj.com
            </a>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="mb-3 font-display text-sm font-bold">{g.title}</h3>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-soft hover:text-primary transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}. Katalogdaki sahneler lisanslı ya da kendi yapımımız olan içeriklerden oluşur.</p>
          <p>Türkiye&apos;de tasarlandı.</p>
        </div>
      </div>
    </footer>
  );
}
