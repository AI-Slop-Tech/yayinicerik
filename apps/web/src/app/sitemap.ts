import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listScenes } from "@/lib/scenes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env().NEXT_PUBLIC_SITE_URL;
  const statics = ["", "/sahneler", "/dublajlar", "/nasil-oynanir", "/fiyatlandirma", "/oda-olustur", "/katil", "/giris", "/gizlilik", "/kullanim-sartlari", "/telif"];
  const scenes = await listScenes({ sort: "new" }).catch(() => []);
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...scenes.map((s) => ({ url: `${base}/sahne/${s.slug}`, lastModified: s.createdAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
