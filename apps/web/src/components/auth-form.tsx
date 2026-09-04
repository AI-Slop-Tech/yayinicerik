"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { email, nickname, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-bg-alt p-1 text-sm font-medium" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 transition ${mode === m ? "bg-surface-2 text-ink" : "text-ink-soft"}`}
          >
            {m === "login" ? "Giriş yap" : "Kayıt ol"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            E-posta
          </label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium">
              Takma ad
            </label>
            <input id="nickname" className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={24} autoComplete="nickname" />
          </div>
        )}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && <p className="mt-1 text-xs text-ink-faint">En az 8 karakter.</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </form>
    </div>
  );
}
