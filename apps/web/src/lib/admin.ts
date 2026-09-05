import "server-only";
import type { LicenseType, Scene, SceneCharacter, SceneLine } from "@kngl/shared";
import { invalidatePrefix } from "./cache";
import { query, queryOne } from "./db";
import { mediaExists, sceneVideoFileName } from "./media";

/** Yönetim paneli veri katmanı: yayınlanmamış sahneler dahil, önbelleksiz okur; yazdıktan sonra önbelleği temizler. */

export interface AdminSceneRow {
  id: string;
  slug: string;
  title: string;
  source: string;
  description: string;
  duration_seconds: number;
  thumbnail_url: string;
  video_url: string;
  is_vip: boolean;
  is_published: boolean;
  play_count: number;
  characters: SceneCharacter[];
  lines: SceneLine[];
  created_at: string;
  updated_at: string;
  license_type: LicenseType;
  license_source: string | null;
  license_holder: string | null;
  license_note: string | null;
}

export interface AdminScene extends Omit<AdminSceneRow, "created_at" | "updated_at"> {
  createdAt: string;
  updatedAt: string;
  video: { exists: boolean; size: number; mtime?: string };
}

const COLS = `id, slug, title, source, description, duration_seconds, thumbnail_url, video_url, is_vip, is_published, play_count,
  characters, lines, created_at, updated_at, license_type, license_source, license_holder, license_note`;

async function decorate(r: AdminSceneRow): Promise<AdminScene> {
  const { created_at, updated_at, ...rest } = r;
  return { ...rest, createdAt: new Date(created_at).toISOString(), updatedAt: new Date(updated_at).toISOString(), video: await mediaExists("scenes", sceneVideoFileName(r.slug)) };
}

export async function adminListScenes(): Promise<AdminScene[]> {
  const rows = await query<AdminSceneRow>(`SELECT ${COLS} FROM scenes ORDER BY created_at DESC`);
  return Promise.all(rows.map(decorate));
}

export async function adminGetScene(id: string): Promise<AdminScene | null> {
  const row = await queryOne<AdminSceneRow>(`SELECT ${COLS} FROM scenes WHERE id = $1`, [id]);
  return row ? decorate(row) : null;
}

export interface SceneInput {
  slug: string;
  title: string;
  source: string;
  description: string;
  durationSeconds: number;
  thumbnailUrl: string;
  isVip: boolean;
  isPublished: boolean;
  characters: SceneCharacter[];
  lines: SceneLine[];
  licenseType: LicenseType;
  licenseSource: string | null;
  licenseHolder: string | null;
  licenseNote: string | null;
}

export async function adminCreateScene(input: SceneInput): Promise<AdminScene> {
  const rows = await query<AdminSceneRow>(
    `INSERT INTO scenes (slug, title, source, description, duration_seconds, thumbnail_url, video_url, is_vip, is_published, characters, lines,
       license_type, license_source, license_holder, license_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15) RETURNING ${COLS}`,
    [input.slug, input.title, input.source, input.description, input.durationSeconds, input.thumbnailUrl, `/media/scenes/${sceneVideoFileName(input.slug)}`,
     input.isVip, input.isPublished, JSON.stringify(input.characters), JSON.stringify(input.lines),
     input.licenseType, input.licenseSource, input.licenseHolder, input.licenseNote],
  );
  await invalidateScenes();
  return decorate(rows[0]);
}

export async function adminUpdateScene(id: string, input: SceneInput): Promise<AdminScene | null> {
  const rows = await query<AdminSceneRow>(
    `UPDATE scenes SET slug=$2, title=$3, source=$4, description=$5, duration_seconds=$6, thumbnail_url=$7, video_url=$8,
       is_vip=$9, is_published=$10, characters=$11::jsonb, lines=$12::jsonb, updated_at=now(),
       license_type=$13, license_source=$14, license_holder=$15, license_note=$16
     WHERE id = $1 RETURNING ${COLS}`,
    [id, input.slug, input.title, input.source, input.description, input.durationSeconds, input.thumbnailUrl, `/media/scenes/${sceneVideoFileName(input.slug)}`,
     input.isVip, input.isPublished, JSON.stringify(input.characters), JSON.stringify(input.lines),
     input.licenseType, input.licenseSource, input.licenseHolder, input.licenseNote],
  );
  await invalidateScenes();
  return rows[0] ? decorate(rows[0]) : null;
}

export async function adminPatchScene(id: string, patch: Partial<Pick<SceneInput, "isPublished" | "isVip" | "thumbnailUrl">>): Promise<void> {
  if (patch.isPublished === true) {
    const row = await queryOne<{ license_type: LicenseType }>(`SELECT license_type FROM scenes WHERE id = $1`, [id]);
    if (row?.license_type === "unknown") throw new Error("Lisans türü belirsiz olan sahne yayınlanamaz. Önce düzenleme ekranından lisansı gir.");
  }
  const sets: string[] = ["updated_at = now()"];
  const params: unknown[] = [id];
  if (patch.isPublished !== undefined) { params.push(patch.isPublished); sets.push(`is_published = $${params.length}`); }
  if (patch.isVip !== undefined) { params.push(patch.isVip); sets.push(`is_vip = $${params.length}`); }
  if (patch.thumbnailUrl !== undefined) { params.push(patch.thumbnailUrl); sets.push(`thumbnail_url = $${params.length}`); }
  await query(`UPDATE scenes SET ${sets.join(", ")} WHERE id = $1`, params);
  await invalidateScenes();
}

export async function adminDeleteScene(id: string): Promise<AdminSceneRow | null> {
  const rows = await query<AdminSceneRow>(`DELETE FROM scenes WHERE id = $1 RETURNING ${COLS}`, [id]);
  await invalidateScenes();
  return rows[0] ?? null;
}

async function invalidateScenes() {
  await Promise.all([invalidatePrefix("scenes:"), invalidatePrefix("scene:"), invalidatePrefix("dubs:")]);
}

/* ---- Öneriler ---- */
export interface Suggestion { id: string; title: string; url: string | null; note: string | null; nickname: string | null; createdAt: string }

export async function adminListSuggestions(): Promise<Suggestion[]> {
  const rows = await query<{ id: string; title: string; url: string | null; note: string | null; nickname: string | null; created_at: string }>(
    `SELECT s.id, s.title, s.url, s.note, u.nickname, s.created_at FROM scene_suggestions s LEFT JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC LIMIT 200`,
  );
  return rows.map((r) => ({ id: r.id, title: r.title, url: r.url, note: r.note, nickname: r.nickname, createdAt: new Date(r.created_at).toISOString() }));
}

export async function adminDeleteSuggestion(id: string): Promise<void> {
  await query(`DELETE FROM scene_suggestions WHERE id = $1`, [id]);
}

/* ---- Prömiyerler ---- */
export interface AdminDub { id: string; roomCode: string; sceneTitle: string; videoUrl: string; voices: string[]; isPublic: boolean; isFeatured: boolean; viewCount: number; createdAt: string }

export async function adminListDubs(): Promise<AdminDub[]> {
  const rows = await query<{ id: string; room_code: string; scene_title: string; video_url: string; voices: string[]; is_public: boolean; is_featured: boolean; view_count: number; created_at: string }>(
    `SELECT d.id, d.room_code, s.title AS scene_title, d.video_url, d.voices, d.is_public, d.is_featured, d.view_count, d.created_at
     FROM dubs d JOIN scenes s ON s.id = d.scene_id ORDER BY d.created_at DESC LIMIT 200`,
  );
  return rows.map((r) => ({ id: r.id, roomCode: r.room_code, sceneTitle: r.scene_title, videoUrl: r.video_url, voices: r.voices, isPublic: r.is_public, isFeatured: r.is_featured, viewCount: r.view_count, createdAt: new Date(r.created_at).toISOString() }));
}

export async function adminPatchDub(id: string, patch: { isPublic?: boolean; isFeatured?: boolean }): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  if (patch.isPublic !== undefined) { params.push(patch.isPublic); sets.push(`is_public = $${params.length}`); }
  if (patch.isFeatured !== undefined) { params.push(patch.isFeatured); sets.push(`is_featured = $${params.length}`); }
  if (!sets.length) return;
  await query(`UPDATE dubs SET ${sets.join(", ")} WHERE id = $1`, params);
  await invalidatePrefix("dubs:");
}

export async function adminDeleteDub(id: string): Promise<void> {
  await query(`DELETE FROM dubs WHERE id = $1`, [id]);
  await invalidatePrefix("dubs:");
}

/** Sahne formundan gelen veriyi doğrular; hata mesajı Türkçe. */
export function validateSceneInput(raw: unknown): { ok: true; value: SceneInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const slug = String(r.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,100}$/.test(slug)) return { ok: false, error: "Slug yalnızca küçük harf, rakam ve tire içermeli (örn. kahvaltida-son-simit)." };
  const title = String(r.title ?? "").trim();
  if (title.length < 2 || title.length > 200) return { ok: false, error: "Başlık 2–200 karakter olmalı." };
  const source = String(r.source ?? "").trim();
  if (!source || source.length > 40) return { ok: false, error: "Tür gerekli." };
  const durationSeconds = Number(r.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 900) return { ok: false, error: "Süre 1–900 saniye olmalı." };
  const characters = Array.isArray(r.characters) ? (r.characters as Array<Record<string, unknown>>) : [];
  if (characters.length < 1 || characters.length > 8) return { ok: false, error: "1–8 rol tanımlanmalı." };
  const chars: SceneCharacter[] = characters.map((c, i) => ({
    id: String(c.id ?? `c${i + 1}`).replace(/[^a-z0-9_-]/gi, "") || `c${i + 1}`,
    name: String(c.name ?? "").trim().slice(0, 40) || `Rol ${i + 1}`,
    color: /^#[0-9a-f]{6}$/i.test(String(c.color ?? "")) ? String(c.color) : "#e8541e",
  }));
  const ids = new Set(chars.map((c) => c.id));
  if (ids.size !== chars.length) return { ok: false, error: "Rol kimlikleri benzersiz olmalı." };
  const lines = Array.isArray(r.lines) ? (r.lines as Array<Record<string, unknown>>) : [];
  if (lines.length < 1 || lines.length > 60) return { ok: false, error: "1–60 replik tanımlanmalı." };
  const outLines: SceneLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const characterId = String(l.characterId ?? "");
    if (!ids.has(characterId)) return { ok: false, error: `${i + 1}. replik için rol seçilmeli.` };
    const text = String(l.text ?? "").trim();
    if (!text || text.length > 300) return { ok: false, error: `${i + 1}. replik metni 1–300 karakter olmalı.` };
    const start = Number(l.start), end = Number(l.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > durationSeconds + 1) {
      return { ok: false, error: `${i + 1}. replik zamanı geçersiz (başlangıç < bitiş ≤ süre).` };
    }
    outLines.push({ id: String(l.id ?? `l${i + 1}`).replace(/[^a-z0-9_-]/gi, "") || `l${i + 1}`, characterId, text, start: Math.round(start * 10) / 10, end: Math.round(end * 10) / 10 });
  }
  const thumbnailUrl = String(r.thumbnailUrl ?? "").trim() || "/thumbs/_placeholder.svg";

  const licenseTypes: LicenseType[] = ["unknown", "public-domain", "cc", "licensed", "own"];
  const licenseType = licenseTypes.find((t) => t === r.licenseType) ?? "unknown";
  const licenseSource = String(r.licenseSource ?? "").trim().slice(0, 500) || null;
  const licenseHolder = String(r.licenseHolder ?? "").trim().slice(0, 200) || null;
  const licenseNote = String(r.licenseNote ?? "").trim().slice(0, 1000) || null;
  const isPublished = r.isPublished === undefined ? true : Boolean(r.isPublished);
  // Lisansı belirsiz bir sahne yayına alınamaz: telif itirazında kaynağı gösterememek en büyük risk.
  if (isPublished && licenseType === "unknown") {
    return { ok: false, error: "Yayına almadan önce lisans türünü seç. Belirsiz kaynaklı sahne yayınlanamaz." };
  }
  if (isPublished && licenseType !== "own" && !licenseSource) {
    return { ok: false, error: "Lisans kaynağını yaz (arşiv bağlantısı, sözleşme referansı ya da izin yazısı)." };
  }

  return {
    ok: true,
    value: {
      slug, title, source, description: String(r.description ?? "").trim().slice(0, 1000), durationSeconds: Math.round(durationSeconds),
      thumbnailUrl, isVip: Boolean(r.isVip), isPublished, characters: chars, lines: outLines,
      licenseType, licenseSource, licenseHolder, licenseNote,
    },
  };
}

export type { Scene };
