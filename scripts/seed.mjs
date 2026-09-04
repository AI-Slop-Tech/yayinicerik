// Sahne kataloğunu ve örnek dublajları ekler (slug üzerinden idempotent upsert).
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const scenes = JSON.parse(await readFile(path.resolve("infra/db/seed/scenes.json"), "utf8"));
const dubs = JSON.parse(await readFile(path.resolve("infra/db/seed/dubs.json"), "utf8"));

await client.query("BEGIN");
for (const s of scenes) {
  await client.query(
    `INSERT INTO scenes (slug, title, source, description, duration_seconds, thumbnail_url, video_url, is_vip, play_count, characters, lines, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb, COALESCE($12::timestamptz, now()))
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title, source = EXCLUDED.source, description = EXCLUDED.description,
       duration_seconds = EXCLUDED.duration_seconds, thumbnail_url = EXCLUDED.thumbnail_url,
       video_url = EXCLUDED.video_url, is_vip = EXCLUDED.is_vip, characters = EXCLUDED.characters,
       lines = EXCLUDED.lines, updated_at = now()`,
    [s.slug, s.title, s.source, s.description, s.durationSeconds, s.thumbnailUrl, s.videoUrl, !!s.isVip, s.playCount ?? 0,
     JSON.stringify(s.characters), JSON.stringify(s.lines), s.createdAt ?? null],
  );
}
for (const d of dubs) {
  const { rows } = await client.query("SELECT id FROM scenes WHERE slug = $1", [d.sceneSlug]);
  if (!rows[0]) continue;
  const exists = await client.query("SELECT 1 FROM dubs WHERE room_code = $1 AND scene_id = $2", [d.roomCode, rows[0].id]);
  if (exists.rowCount) continue;
  await client.query(
    `INSERT INTO dubs (room_code, scene_id, video_url, thumbnail_url, voices, duration_seconds, is_featured, view_count, created_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8, COALESCE($9::timestamptz, now()))`,
    [d.roomCode, rows[0].id, d.videoUrl, d.thumbnailUrl ?? null, JSON.stringify(d.voices), d.durationSeconds, !!d.isFeatured, d.viewCount ?? 0, d.createdAt ?? null],
  );
}
await client.query("COMMIT");
await client.end();
console.log(`Seed tamam: ${scenes.length} sahne, ${dubs.length} dublaj.`);
