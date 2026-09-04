"use client";

import { useRouter } from "next/navigation";

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/giris");
        router.refresh();
      }}
    >
      Çıkış
    </button>
  );
}
