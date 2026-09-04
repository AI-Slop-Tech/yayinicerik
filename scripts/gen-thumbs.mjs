// Sahne afişleri (4:3): dış görsel bağımlılığı olmadan, her sahne için deterministik SVG üretir.
// Başlık metni SVG içinde değildir; kart bileşeni başlığı ayrıca yazar, böylece kırpma sorunu olmaz.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const scenes = JSON.parse(await readFile(path.resolve("infra/db/seed/scenes.json"), "utf8"));
const outDir = path.resolve("apps/web/public/thumbs");
await mkdir(outDir, { recursive: true });

const palettes = {
  "Dizi": ["#1c1f3a", "#4a3aff", "#ff5d73"],
  "Film": ["#13202b", "#ff7a45", "#f4d35e"],
  "Çizgi film": ["#1a2a24", "#3fd0a8", "#f4d35e"],
  "Reklam": ["#2b1a10", "#ffb443", "#ff5d73"],
  "Efsane an": ["#241533", "#8f7bff", "#4cc9f0"],
  "Komedi": ["#10222e", "#4cc9f0", "#ffb443"],
};

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

for (const s of scenes) {
  const [bg, a, b] = palettes[s.source] ?? ["#111", "#888", "#ccc"];
  const h = hash(s.slug);
  const shapes = Array.from({ length: 5 }, (_, i) => {
    const r = ((h >> (i * 5)) & 31) / 31;
    const cx = 80 + ((h >> (i * 3)) % 640);
    const cy = 60 + ((h >> (i * 7)) % 450);
    const rad = 60 + r * 160;
    return `<circle cx="${cx}" cy="${cy}" r="${rad.toFixed(0)}" fill="${i % 2 ? a : b}" opacity="${(0.10 + r * 0.18).toFixed(2)}"/>`;
  }).join("");
  const bars = Array.from({ length: 48 }, (_, i) => {
    const v = 8 + (((h * (i + 3)) >>> 0) % 70);
    return `<rect x="${40 + i * 15}" y="${(330 - v / 2).toFixed(0)}" width="6" height="${v}" rx="3" fill="#fff" opacity="0.6"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${esc(s.title)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${a}" stop-opacity="0.55"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="40"/></filter></defs>
<rect width="800" height="600" fill="url(#g)"/>
<g filter="url(#blur)">${shapes}</g>
<g>${bars}</g>
<text x="40" y="62" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif" font-size="18" font-weight="600" fill="#fff" opacity="0.75" letter-spacing="3">${esc(s.source.toUpperCase())}</text>
<circle cx="740" cy="540" r="22" fill="#fff" opacity="0.9"/><path d="M733 530l16 10-16 10z" fill="${bg}"/>
</svg>`;
  await writeFile(path.join(outDir, `${s.slug}.svg`), svg);
}
console.log(`${scenes.length} afiş üretildi → ${outDir}`);
