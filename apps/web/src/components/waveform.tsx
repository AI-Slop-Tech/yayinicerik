/** Dekoratif ses dalgası: CSS animasyonlu, JS'siz, erişilebilirlik ağacından gizli. */
export function Waveform({ bars = 28, className = "" }: { bars?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-current animate-wave"
          style={{ height: `${14 + ((i * 37) % 26)}px`, animationDelay: `${(i % 7) * 0.12}s`, opacity: 0.55 + ((i * 13) % 10) / 22 }}
        />
      ))}
    </div>
  );
}
