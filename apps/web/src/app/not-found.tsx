import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Bu sahne kurguda kesildi.</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Aradığın sayfa yok ya da ekibin süresi dolmuş olabilir.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-secondary">
          Ana sayfa
        </Link>
        <Link href="/oda-olustur" className="btn btn-primary">
          Ekip kur
        </Link>
      </div>
    </div>
  );
}
