import type { LicenseType, Scene, SceneCharacter, SceneLine, SceneSummary } from "@kngl/shared";
import { cached } from "./cache";
import { query, queryOne } from "./db";

interface SceneRow {
  id: string;
  slug: string;
  title: string;
  source: string;
  description: string;
  duration_seconds: number;
  thumbnail_url: string;
  video_url: string;
  is_vip: boolean;
  play_count: number;
  characters: SceneCharacter[];
  lines: SceneLine[];
  created_at: string;
  license_type: LicenseType;
  license_source: string | null;
  license_holder: string | null;
  license_note: string | null;
}

const SUMMARY_COLS = `id, slug, title, source, description, duration_seconds, thumbnail_url, video_url, is_vip, play_count,
  jsonb_array_length(characters) AS character_count, characters, lines, created_at,
  license_type, license_source, license_holder, license_note`;

function toSummary(r: SceneRow & { character_count?: number }): SceneSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    source: r.source,
    durationSeconds: r.duration_seconds,
    characterCount: r.character_count ?? r.characters.length,
    thumbnailUrl: r.thumbnail_url,
    isVip: r.is_vip,
    playCount: r.play_count,
    createdAt: new Date(r.created_at).toISOString(),
    license: { type: r.license_type, source: r.license_source, holder: r.license_holder, note: r.license_note },
  };
}

function toScene(r: SceneRow): Scene {
  return { ...toSummary(r), description: r.description, videoUrl: r.video_url, characters: r.characters, lines: r.lines };
}

export const SCENE_SOURCES = ["Dizi", "Film", "Çizgi film", "Komedi", "Reklam", "Efsane an"] as const;

export function listPopularScenes(limit = 8): Promise<SceneSummary[]> {
  return cached(`scenes:popular:${limit}`, { ttlSeconds: 60 }, async () => {
    const rows = await query<SceneRow>(
      `SELECT ${SUMMARY_COLS} FROM scenes WHERE is_published ORDER BY play_count DESC, created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toSummary);
  });
}

export function listNewScenes(limit = 8): Promise<SceneSummary[]> {
  return cached(`scenes:new:${limit}`, { ttlSeconds: 60 }, async () => {
    const rows = await query<SceneRow>(
      `SELECT ${SUMMARY_COLS} FROM scenes WHERE is_published ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toSummary);
  });
}

export interface SceneFilter {
  source?: string;
  characters?: number;
  q?: string;
  sort?: "popular" | "new" | "short";
}

export function listScenes(filter: SceneFilter): Promise<SceneSummary[]> {
  const key = `scenes:list:${JSON.stringify(filter)}`;
  return cached(key, { ttlSeconds: 60 }, async () => {
    const where: string[] = ["is_published"];
    const params: unknown[] = [];
    if (filter.source) {
      params.push(filter.source);
      where.push(`source = $${params.length}`);
    }
    if (filter.characters) {
      params.push(filter.characters);
      where.push(filter.characters >= 4 ? `jsonb_array_length(characters) >= $${params.length}` : `jsonb_array_length(characters) = $${params.length}`);
    }
    if (filter.q) {
      params.push(`%${filter.q.slice(0, 60)}%`);
      where.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    const order =
      filter.sort === "new" ? "created_at DESC" : filter.sort === "short" ? "duration_seconds ASC" : "play_count DESC, created_at DESC";
    const rows = await query<SceneRow>(`SELECT ${SUMMARY_COLS} FROM scenes WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 60`, params);
    return rows.map(toSummary);
  });
}

export function getSceneBySlug(slug: string): Promise<Scene | null> {
  return cached(`scene:slug:${slug}`, { ttlSeconds: 300, localTtlMs: 10_000 }, async () => {
    const row = await queryOne<SceneRow>(`SELECT ${SUMMARY_COLS} FROM scenes WHERE slug = $1 AND is_published`, [slug]);
    return row ? toScene(row) : null;
  });
}

export function getSceneById(id: string): Promise<Scene | null> {
  return cached(`scene:id:${id}`, { ttlSeconds: 300, localTtlMs: 10_000 }, async () => {
    const row = await queryOne<SceneRow>(`SELECT ${SUMMARY_COLS} FROM scenes WHERE id = $1 AND is_published`, [id]);
    return row ? toScene(row) : null;
  });
}

/** Oynanma sayacı: sıcak yolda DB'yi kilitlememek için "fire and forget". */
export function bumpPlayCount(id: string): void {
  query(`UPDATE scenes SET play_count = play_count + 1 WHERE id = $1`, [id]).catch((err) =>
    console.warn("[scenes] play_count update failed", (err as Error).message),
  );
}

export function countScenes(): Promise<number> {
  return cached("scenes:count", { ttlSeconds: 300 }, async () => {
    const row = await queryOne<{ n: string }>(`SELECT count(*)::text AS n FROM scenes WHERE is_published`);
    return Number(row?.n ?? 0);
  });
}
