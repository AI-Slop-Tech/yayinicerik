import pg from "pg";
import type { Scene } from "@kngl/shared";
import { env } from "./env.js";

/** Küçük, salt okunur havuz: yalnızca sahne karakter/replik verisi okunur ve süreç içinde önbelleklenir. */
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 3, idleTimeoutMillis: 30_000, application_name: "kngl-realtime" });
pool.on("error", (err) => console.error("[pg]", err.message));

const cache = new Map<string, { scene: Scene; at: number }>();
const TTL = 5 * 60 * 1000;

export async function getScene(id: string): Promise<Scene | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.scene;
  const { rows } = await pool.query(
    `SELECT id, slug, title, source, description, duration_seconds, thumbnail_url, video_url, is_vip, play_count, characters, lines, created_at
     FROM scenes WHERE id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  const scene: Scene = {
    id: r.id,
    slug: r.slug,
    title: r.title,
    source: r.source,
    description: r.description,
    durationSeconds: r.duration_seconds,
    characterCount: r.characters.length,
    thumbnailUrl: r.thumbnail_url,
    videoUrl: r.video_url,
    isVip: r.is_vip,
    playCount: r.play_count,
    createdAt: new Date(r.created_at).toISOString(),
    characters: r.characters,
    lines: r.lines,
  };
  cache.set(id, { scene, at: Date.now() });
  return scene;
}

export async function closeScenes() {
  await pool.end();
}
