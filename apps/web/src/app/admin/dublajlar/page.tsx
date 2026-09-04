import { requireAdminPage } from "@/lib/admin-guard";
import { adminListDubs } from "@/lib/admin";
import { DubRow } from "@/components/admin/dub-row";

export const dynamic = "force-dynamic";

export default async function AdminDubsPage() {
  await requireAdminPage();
  const dubs = await adminListDubs();
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Prömiyerler</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {dubs.length} video. &quot;Haftanın prömiyeri&quot; ana sayfada öne çıkar; en son işaretlenen gösterilir.
      </p>
      {dubs.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-ink-soft">Henüz prömiyer yok.</div>
      ) : (
        <ul className="card mt-6 divide-y divide-line">
          {dubs.map((d) => (
            <DubRow key={d.id} dub={d} />
          ))}
        </ul>
      )}
    </div>
  );
}
