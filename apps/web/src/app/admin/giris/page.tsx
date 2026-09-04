import { redirect } from "next/navigation";
import { isAdmin, isAdminEnabled } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const enabled = isAdminEnabled();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Yönetici girişi</h1>
      {enabled ? (
        <>
          <p className="mt-2 text-sm text-ink-soft">Sahneleri, videoları ve prömiyerleri yönetmek için şifreni gir.</p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </>
      ) : (
        <div className="card mt-6 p-5 text-sm text-ink-soft">
          Yönetim paneli kapalı. Sunucuda <code className="font-mono text-ink">ADMIN_PASSWORD</code> (en az 8 karakter) tanımlayıp uygulamayı yeniden başlatın.
          Coolify&apos;da bu değer <code className="font-mono text-ink">SERVICE_PASSWORD_ADMIN</code> olarak otomatik üretilir; Environment Variables ekranından okuyabilirsiniz.
        </div>
      )}
    </div>
  );
}
