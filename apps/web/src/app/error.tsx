"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-ink-faint">Hata</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Bir şeyler ters gitti.</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Geçici bir sorun olabilir. Tekrar denemek genellikle çözer.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-faint">Referans: {error.digest}</p>}
      <button className="btn btn-primary mt-6" onClick={reset} type="button">
        Tekrar dene
      </button>
    </div>
  );
}
