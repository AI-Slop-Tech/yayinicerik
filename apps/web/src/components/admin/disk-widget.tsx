import { diskUsage } from "@/lib/media";

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** Disk kullanımı: sunucu alanı kısıtlı olduğu için panelde sürekli görünür. */
export async function DiskWidget() {
  const d = await diskUsage();
  const rows = [
    { label: "Sahne videoları", value: d.scenes },
    { label: "Prömiyerler", value: d.dubs },
    { label: "Afişler", value: d.thumbs },
    { label: "Kaynaklar (geçici)", value: d.sources },
  ];
  const total = rows.reduce((n, r) => n + r.value, 0);
  const sourcePct = Math.min(100, (d.sources / d.sourceLimit) * 100);

  return (
    <div className="card p-4">
      <h2 className="text-xs font-semibold tracking-widest text-ink-faint">DİSK</h2>
      <p className="mt-2 font-display text-2xl font-extrabold">{fmtBytes(total)}</p>
      <p className="text-xs text-ink-faint">medya toplamı{d.free !== null && <> · sunucuda {fmtBytes(d.free)} boş</>}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-3">
            <span className="text-ink-soft">{r.label}</span>
            <span className="font-mono tabular-nums">{fmtBytes(r.value)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-ink-faint">
          <span>Kaynak alanı</span>
          <span>{fmtBytes(d.sources)} / {fmtBytes(d.sourceLimit)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className={`h-full ${sourcePct > 85 ? "bg-rec" : "bg-primary"}`} style={{ width: `${sourcePct}%` }} />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Sahne videoları 720p&apos;ye küçültülür. Kaynaklar kesildikten sonra, kesilmezse 24 saat içinde silinir.
        Prömiyerler 30 gün saklanır.
      </p>
    </div>
  );
}
