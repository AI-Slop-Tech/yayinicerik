"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles, UserRound, Mic } from "lucide-react";
import { Logo } from "./logo";

const NAV = [
  { href: "/sahneler", label: "Sahneler" },
  { href: "/dublajlar", label: "Prömiyerler" },
  { href: "/nasil-oynanir", label: "Nasıl işler" },
  { href: "/fiyatlandirma", label: "Plus" },
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

  const close = () => setOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] ${
        scrolled || open ? "bg-bg/90 backdrop-blur-xl border-b border-line shadow-[0_1px_0_rgb(23_24_31/0.03)]" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-[68px] items-center gap-6">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Ana menü">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active ? "text-primary" : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          {identity ? (
            <Link href="/hesabim" className="btn btn-ghost">
              {identity.isVip ? <Sparkles className="size-4 text-primary" aria-hidden /> : <UserRound className="size-4" aria-hidden />}
              <span className="max-w-[10rem] truncate">{identity.nickname}</span>
            </Link>
          ) : (
            <Link href="/giris" className="btn btn-ghost">
              Giriş yap
            </Link>
          )}
          <Link href="/katil" className="btn btn-secondary">
            Koda katıl
          </Link>
          <Link href="/oda-olustur" className="btn btn-primary">
            <Mic className="size-4" aria-hidden />
            Ekip kur
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden btn btn-ghost ml-auto -mr-2 px-2"
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
              <Link key={item.href} href={item.href} onClick={close} className="rounded-lg px-3 py-3 text-base font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Link href={identity ? "/hesabim" : "/giris"} onClick={close} className="btn btn-secondary">
                {identity ? identity.nickname : "Giriş yap"}
              </Link>
              <Link href="/katil" onClick={close} className="btn btn-secondary">
                Koda katıl
              </Link>
              <Link href="/oda-olustur" onClick={close} className="btn btn-primary col-span-2">
                <Mic className="size-4" aria-hidden /> Ekip kur
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
