"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ url, label = "Sil", confirm: message = "Silinsin mi?", redirectTo }: { url: string; label?: string; confirm?: string; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost text-rec"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(message)) return;
        setBusy(true);
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) {
          window.alert(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Silinemedi.");
          setBusy(false);
          return;
        }
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    >
      <Trash2 className="size-4" aria-hidden /> {label}
    </button>
  );
}
