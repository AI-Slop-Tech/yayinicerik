export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-2">Yasal</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-faint">Son güncelleme: {updated}</p>
        <div className="prose-kngl mt-8 space-y-4 text-ink-soft leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </div>
  );
}
