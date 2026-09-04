"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Crown, LogIn, Plus } from "lucide-react";
import { Logo } from "./logo";

const NAV = [
  { href: "/oda-olustur", label: "Oyna" },
  { href: "/sahneler", label: "Sahneler" },
  { href: "/dublajlar", label: "Dublajlar" },
  { href: "/nasil-oynanir", label: "Nasıl oynanır" },
  { href: "/fiyatlandirma", label: "VIP" },
];

export interface HeaderIdentity {
  nickname: string;
  isGuest: boolean;
  isVip: boolean;
}

export function Header({ identity }: { identity: HeaderIdentity | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled || open ? "bg-bg/85 backdrop-blur-xl border-b border-line" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1" aria-label="Ana menü">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active ? "bg-surface-2 text-ink" : "text-ink-soft hover:text-ink hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {identity ? (
            <Link href="/hesabim" className="btn btn-ghost">
              {identity.isVip && <Crown className="size-4 text-primary" aria-hidden />}
              <span className="max-w-[10rem] truncate">{identity.nickname}</span>
            </Link>
          ) : (
            <Link href="/giris" className="btn btn-ghost">
              <LogIn className="size-4" aria-hidden />
              Giriş yap
            </Link>
          )}
          <Link href="/oda-olustur" className="btn btn-primary">
            <Plus className="size-4" aria-hidden />
            Oda kur
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden btn btn-ghost -mr-2 px-2"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="md:hidden border-t border-line bg-bg/95 backdrop-blur-xl" aria-label="Mobil menü">
          <div className="container-x flex flex-col py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-ink-soft hover:bg-white/5 hover:text-ink">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              <Link href={identity ? "/hesabim" : "/giris"} onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
                {identity ? identity.nickname : "Giriş yap"}
              </Link>
              <Link href="/oda-olustur" onClick={() => setOpen(false)} className="btn btn-primary flex-1">
                Oda kur
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
