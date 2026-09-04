"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Giriş başarısız.");
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label htmlFor="pw" className="mb-1.5 block text-sm font-medium">
          Şifre
        </label>
        <input id="pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" autoFocus />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-dark w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LockKeyhole className="size-4" aria-hidden />} Giriş yap
      </button>
    </form>
  );
}
