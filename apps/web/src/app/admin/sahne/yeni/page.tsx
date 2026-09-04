import { requireAdminPage } from "@/lib/admin-guard";
import { SceneForm } from "@/components/admin/scene-form";

export const dynamic = "force-dynamic";

export default async function NewScenePage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Yeni sahne</h1>
      <p className="mt-1 text-sm text-ink-soft">Önce sahneyi kaydet; video ve afişi kaydettikten sonra düzenleme ekranından yükleyebilirsin.</p>
      <div className="mt-6">
        <SceneForm />
      </div>
    </div>
  );
}
