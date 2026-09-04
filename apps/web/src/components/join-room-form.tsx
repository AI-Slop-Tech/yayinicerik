"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { ROOM_CODE_LENGTH, isValidRoomCode, normalizeRoomCode } from "@kngl/shared";

export function JoinRoomForm({ initialCode, nickname }: { initialCode: string; nickname: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState(normalizeRoomCode(initialCode));
  const [nick, setNick] = useState(nickname ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = normalizeRoomCode(code);
    if (!isValidRoomCode(c)) {
      setError("Kod 6 karakter olmalı.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!nickname) {
        const r = await fetch("/api/auth/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: nick }) });
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? "Takma ad kabul edilmedi.");
      }
      const res = await fetch(`/api/rooms/${c}`);
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Oda bulunamadı.");
      router.push(`/oda/${c}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8 space-y-6">
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium">
          Oda kodu
        </label>
        <input
          id="code"
          className="input text-center font-mono text-2xl tracking-[0.4em] uppercase"
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          placeholder="K7X2PQ"
          maxLength={ROOM_CODE_LENGTH}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          required
        />
      </div>
      {!nickname && (
        <div>
          <label htmlFor="nick" className="mb-2 block text-sm font-medium">
            Takma adın
          </label>
          <input id="nick" className="input" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="örn. sessizadam" maxLength={24} required autoComplete="nickname" />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full py-3.5 text-base" disabled={busy}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <KeyRound className="size-5" aria-hidden />}
        Odaya katıl
      </button>
    </form>
  );
}
