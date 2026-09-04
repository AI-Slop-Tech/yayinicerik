import Link from "next/link";
import { BRAND } from "@kngl/shared";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#ffb443" />
      <rect x="9" y="6" width="6" height="14" rx="3" fill="#1a1204" />
      <rect x="17" y="10" width="6" height="10" rx="3" fill="#1a1204" opacity="0.7" />
      <path d="M9 23c0 2.5 3 4 7 4s7-1.5 7-4" stroke="#1a1204" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label={`${BRAND.name} ana sayfa`}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight leading-none">
          KNGL<span className="text-primary"> Dublaj</span>
        </span>
      )}
    </Link>
  );
}
