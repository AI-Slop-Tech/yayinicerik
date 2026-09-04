import Link from "next/link";
import { BRAND } from "@kngl/shared";

/** Marka işareti: konuşma balonu içinde "K" harfi ve ses dalgası. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 5h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-6 5v-5H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" fill="#e8541e" />
      <path d="M10 10v10M10 15l6-5M10 15l6 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 12v6M23 10v10M26 13v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} ana sayfa`}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight leading-none">
          KNGL <span className="text-primary">Dublaj</span>
        </span>
      )}
    </Link>
  );
}
