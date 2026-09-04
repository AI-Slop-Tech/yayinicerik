import Link from "next/link";
import { BRAND } from "@kngl/shared";
import { Logo } from "./logo";

const cols = [
  {
    title: "Oyna",
    links: [
      { href: "/oda-olustur", label: "Oda kur" },
      { href: "/katil", label: "Koda katıl" },
      { href: "/sahneler", label: "Sahneler" },
      { href: "/dublajlar", label: "Dublajlar" },
      { href: "/nasil-oynanir", label: "Nasıl oynanır" },
    ],
  },
  {
    title: "Hesap",
    links: [
      { href: "/giris", label: "Giriş / Kayıt" },
      { href: "/hesabim", label: "Hesabım" },
      { href: "/fiyatlandirma", label: "KNGL VIP" },
      { href: "/sahne-oner", label: "Sahne öner" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/gizlilik", label: "Gizlilik" },
      { href: "/kullanim-sartlari", label: "Kullanım şartları" },
      { href: "/telif", label: "Telif bildirimi" },
      { href: "/durum", label: "Sistem durumu" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-alt">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-ink-soft leading-relaxed">
            Bir sahnedeki karakterleri arkadaşlarınla seslendir, sonra birlikte yaptığınız videoyu izle.
          </p>
          <a href="mailto:merhaba@kngldublaj.com" className="text-sm text-ink-soft hover:text-ink">
            merhaba@kngldublaj.com
          </a>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-xs font-semibold tracking-[0.16em] uppercase text-ink-faint">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-ink transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}. Sahneler yalnızca kullanım hakkına sahip olduğumuz içeriklerden üretilir.</p>
          <p>Her video {BRAND.name} imzası taşır.</p>
        </div>
      </div>
    </footer>
  );
}
