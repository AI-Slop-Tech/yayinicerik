import { cached } from "./cache";
import { query, queryOne } from "./db";

export interface DubSummary {
  id: string;
  roomCode: string;
  sceneSlug: string;
  sceneTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  voices: string[];
  durationSeconds: number;
  viewCount: number;
  createdAt: string;
}

interface DubRow {
  id: string;
  room_code: string;
  scene_slug: string;
  scene_title: string;
  video_url: string;
  thumbnail_url: string | null;
  scene_thumbnail: string;
  voices: string[];
  duration_seconds: number;
  view_count: number;
  created_at: string;
}

const COLS = `d.id, d.room_code, s.slug AS scene_slug, s.title AS scene_title, d.video_url, d.thumbnail_url,
  s.thumbnail_url AS scene_thumbnail, d.voices, d.duration_seconds, d.view_count, d.created_at`;

function toDub(r: DubRow): DubSummary {
  return {
    id: r.id,
    roomCode: r.room_code,
    sceneSlug: r.scene_slug,
    sceneTitle: r.scene_title,
    videoUrl: r.video_url,
    thumbnailUrl: r.thumbnail_url ?? r.scene_thumbnail,
    voices: r.voices,
    durationSeconds: r.duration_seconds,
    viewCount: r.view_count,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export function getDubOfTheDay(): Promise<DubSummary | null> {
  return cached("dubs:featured", { ttlSeconds: 120 }, async () => {
    const row =
      (await queryOne<DubRow>(
        `SELECT ${COLS} FROM dubs d JOIN scenes s ON s.id = d.scene_id
         WHERE d.is_public AND d.is_featured ORDER BY d.created_at DESC LIMIT 1`,
      )) ??
      (await queryOne<DubRow>(
        `SELECT ${COLS} FROM dubs d JOIN scenes s ON s.id = d.scene_id
         WHERE d.is_public ORDER BY d.view_count DESC, d.created_at DESC LIMIT 1`,
      ));
    return row ? toDub(row) : null;
  });
}

export function listRecentDubs(limit = 24): Promise<DubSummary[]> {
  return cached(`dubs:recent:${limit}`, { ttlSeconds: 60 }, async () => {
    const rows = await query<DubRow>(
      `SELECT ${COLS} FROM dubs d JOIN scenes s ON s.id = d.scene_id WHERE d.is_public ORDER BY d.created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toDub);
  });
}

export function countDubs(): Promise<number> {
  return cached("dubs:count", { ttlSeconds: 300 }, async () => {
    const row = await queryOne<{ n: string }>(`SELECT count(*)::text AS n FROM dubs WHERE is_public`);
    return Number(row?.n ?? 0);
  });
}
