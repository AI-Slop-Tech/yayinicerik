import "server-only";
import { redirect } from "next/navigation";
import { isAdmin, isAdminEnabled } from "./auth";

/** Sunucu bileşenleri için: yönetici değilse giriş sayfasına yönlendirir. */
export async function requireAdminPage(): Promise<void> {
  if (!isAdminEnabled()) redirect("/admin/giris?kapali=1");
  if (!(await isAdmin())) redirect("/admin/giris");
}
