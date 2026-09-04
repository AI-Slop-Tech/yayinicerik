import { requireAdminPage } from "@/lib/admin-guard";
import { adminListSuggestions } from "@/lib/admin";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  await requireAdminPage();
  const items = await adminListSuggestions();
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Sahne önerileri</h1>
      <p className="mt-1 text-sm text-ink-soft">{items.length} öneri. Lisansını alabildiklerini &quot;Yeni sahne&quot; ile kataloğa ekle.</p>
      {items.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-ink-soft">Henüz öneri yok.</div>
      ) : (
        <ul className="card mt-6 divide-y divide-line">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold">{s.title}</p>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-blue underline underline-offset-2">
                    {s.url}
                  </a>
                )}
                {s.note && <p className="mt-1 text-sm text-ink-soft">{s.note}</p>}
                <p className="mt-1 text-xs text-ink-faint">
                  {s.nickname ?? "misafir"} · {new Date(s.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <DeleteButton url={`/api/admin/suggestions/${s.id}`} label="Sil" confirm="Bu öneri silinsin mi?" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
