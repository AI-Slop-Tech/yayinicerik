import Link from "next/link";
import { MessageCircle, Lightbulb } from "lucide-react";
import { env } from "@/lib/env";

/** İki eşit kart: topluluk ve sahne önerisi. */
export function CommunityCta() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="card flex flex-col justify-between gap-6 p-8">
        <div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">Ekip arıyorsan burada.</h2>
          <p className="mt-2 text-ink-soft">Hafta sonu turnuvaları, açık odalar ve yeni sahne duyuruları Discord&apos;da.</p>
        </div>
        <a href={env().DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-dark self-start">
          Discord&apos;a katıl
        </a>
      </div>
      <div className="card flex flex-col justify-between gap-6 p-8">
        <div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Lightbulb className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">Aklında bir sahne mi var?</h2>
          <p className="mt-2 text-ink-soft">Öner; lisans ekibimiz hakkını alabilirse kataloğa ekler, adını da sahnenin altına yazar.</p>
        </div>
        <Link href="/sahne-oner" className="btn btn-secondary self-start">
          Sahne öner
        </Link>
      </div>
    </div>
  );
}
