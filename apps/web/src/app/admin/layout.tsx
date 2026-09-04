import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { AdminLogout } from "@/components/admin/admin-logout";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Sahneler" },
  { href: "/admin/sahne/yeni", label: "Yeni sahne" },
  { href: "/admin/dublajlar", label: "Prömiyerler" },
  { href: "/admin/oneriler", label: "Öneriler" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className="container-x py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-accent px-2 py-0.5 font-display text-xs font-bold text-white">YÖNETİM</span>
          {admin && (
            <nav className="flex flex-wrap gap-1" aria-label="Yönetim menüsü">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="btn btn-ghost px-3 py-1.5">
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {admin && <AdminLogout />}
      </div>
      {children}
    </div>
  );
}
