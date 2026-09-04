import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Giriş yap / Kayıt ol" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const identity = await getIdentity();
  const { next } = await searchParams;
  if (identity && !identity.isGuest) redirect("/hesabim");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/hesabim";
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-md">
        <p className="eyebrow mb-2">Hesap</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Giriş yap</h1>
        <p className="mt-3 text-ink-soft">Prömiyerlerini sakla, Plus&apos;a geç, sahne öner. Misafir olarak oynamaya devam da edebilirsin.</p>
        <div className="mt-8">
          <AuthForm next={safeNext} />
        </div>
      </div>
    </div>
  );
}
