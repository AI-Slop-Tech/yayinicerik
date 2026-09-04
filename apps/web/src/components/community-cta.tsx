import { MessageCircle } from "lucide-react";
import { env } from "@/lib/env";

export function CommunityCta() {
  return (
    <div className="card relative overflow-hidden p-8 sm:p-12 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(143_123_255/0.18),transparent)] pointer-events-none" />
      <div className="relative">
        <p className="eyebrow mb-3 text-accent">Topluluk</p>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Sohbet dublajdan sonra da sürer.</h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-soft">
          Yeni oyuncular bul, sahne öner, etkinliklere katıl ve yeni ekipler kur.
        </p>
        <a href={env().DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-7">
          <MessageCircle className="size-4" aria-hidden /> Discord&apos;a katıl
        </a>
      </div>
    </div>
  );
}
