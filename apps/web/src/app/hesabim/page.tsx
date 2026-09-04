import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { getIdentity } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = { title: "Hesabım" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/giris");
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-2">Hesap</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Merhaba, {identity.nickname}</h1>
        <div className="card mt-8 divide-y divide-line">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-ink-faint">Hesap türü</p>
              <p className="font-medium">{identity.isGuest ? "Misafir" : "Kayıtlı üye"}</p>
            </div>
            {identity.isGuest && (
              <Link href="/giris" className="btn btn-secondary">
                Kayıt ol
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-ink-faint">Üyelik</p>
              <p className="font-medium flex items-center gap-1.5">
                {identity.isVip ? (
                  <>
                    <Crown className="size-4 text-primary" aria-hidden /> KNGL VIP
                  </>
                ) : (
                  "Ücretsiz"
                )}
              </p>
            </div>
            {!identity.isVip && (
              <Link href="/fiyatlandirma" className="btn btn-primary">
                VIP ol
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-ink-faint">Dublajlarım</p>
              <p className="font-medium">Odalarından çıkan videolar 30 gün saklanır (VIP: süresiz).</p>
            </div>
            <Link href="/dublajlar" className="btn btn-ghost">
              Arşiv
            </Link>
          </div>
          {!identity.isGuest && (
            <div className="flex items-center justify-between p-5">
              <p className="text-sm text-ink-soft">Bu cihazdan çıkış yap.</p>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
