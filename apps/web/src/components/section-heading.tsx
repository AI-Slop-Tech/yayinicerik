import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-ink-soft leading-relaxed">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="btn btn-secondary self-start sm:self-auto">
          {hrefLabel ?? "Tümü"} <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
