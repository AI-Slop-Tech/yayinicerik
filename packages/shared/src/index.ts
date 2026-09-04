/**
 * @kngl/shared — web, realtime ve worker arasında paylaşılan tipler ve saf yardımcılar.
 * Bu paket bilinçli olarak bağımlılıksızdır; her servis tarafından güvenle içe aktarılır.
 */

export const BRAND = {
  name: "KNGL Dublaj",
  shortName: "KNGL",
  domain: "kngldublaj.com",
  tagline: "Sahneyi seslendir. Arkadaşlarınla.",
} as const;

/** Oda kodu: karışıklığa yol açan karakterler (0/O, 1/I/L) çıkarıldı. */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;

export const LIMITS = {
  /** Oda kaç saniye sonra Redis'ten silinir (son aktiviteden itibaren). */
  roomTtlSeconds: 6 * 60 * 60,
  /** Bir odadaki en fazla oyuncu sayısı. */
  maxPlayers: 8,
  /** Bir odadaki en az oyuncu sayısı. */
  minPlayers: 1,
  /** Takma ad uzunluğu. */
  nicknameMin: 2,
  nicknameMax: 24,
  /** Tek bir replik kaydı için üst sınır (bayt). */
  maxTakeBytes: 8 * 1024 * 1024,
  /** Tek bir replik kaydı için üst sınır (saniye). */
  maxTakeSeconds: 30,
} as const;

export type RoomPhase =
  | "lobby" // oyuncular toplanıyor
  | "casting" // karakterler dağıtıldı, herkes görüyor
  | "recording" // herkes kendi repliklerini kaydediyor
  | "rendering" // worker final videoyu üretiyor
  | "done" // final video hazır
  | "failed"; // render başarısız

export interface SceneLine {
  id: string;
  /** Sahnedeki karakter kimliği (scene.characters[].id). */
  characterId: string;
  /** Replik metni (oyuncuya gösterilir). */
  text: string;
  /** Saniye cinsinden başlangıç ve bitiş. */
  start: number;
  end: number;
}

export interface SceneCharacter {
  id: string;
  name: string;
  /** Kart üzerindeki renk (hex). */
  color: string;
}

export interface SceneSummary {
  id: string;
  slug: string;
  title: string;
  source: string; // örn. "Dizi", "Film", "Çizgi film", "Reklam"
  durationSeconds: number;
  characterCount: number;
  thumbnailUrl: string;
  isVip: boolean;
  playCount: number;
  createdAt: string;
}

export interface Scene extends SceneSummary {
  description: string;
  videoUrl: string;
  characters: SceneCharacter[];
  lines: SceneLine[];
}

export interface RoomPlayer {
  id: string; // kullanıcı/misafir kimliği
  nickname: string;
  isHost: boolean;
  connected: boolean;
  characterId: string | null;
  /** Tamamlanan replik id listesi. */
  completedLines: string[];
  joinedAt: number;
}

export interface RoomState {
  code: string;
  sceneId: string;
  sceneSlug: string;
  hostId: string;
  /** Oda kurulurken host VIP miydi? Render önceliği ve kalite bundan belirlenir. */
  hostIsVip: boolean;
  phase: RoomPhase;
  players: RoomPlayer[];
  createdAt: number;
  updatedAt: number;
  /** playerId → sahip olduğu karakter id listesi (casting sonrası dolar). */
  assignments: Record<string, string[]>;
  /** Render işi kuyruğa alındığında BullMQ job id. */
  renderJobId: string | null;
  /** Hazır olduğunda final video adresi. */
  finalVideoUrl: string | null;
  /** Hata mesajı (failed). */
  error: string | null;
}

/** Socket.IO olay isimleri — tek yerden yönetilir. */
export const EVENTS = {
  // istemci → sunucu
  join: "room:join",
  leave: "room:leave",
  start: "room:start",
  record: "room:record",
  lineDone: "room:line-done",
  restart: "room:restart",
  // sunucu → istemci
  state: "room:state",
  error: "room:error",
  final: "room:final",
} as const;

export interface RenderJobData {
  roomCode: string;
  sceneId: string;
  /** VIP odalar kuyrukta öne alınır. */
  priority: "vip" | "normal";
  /** Her replik için yüklenmiş ses dosyası (worker'ın erişebildiği yol). */
  takes: Array<{ lineId: string; playerId: string; path: string; start: number; end: number }>;
}

export const QUEUE_NAMES = {
  render: "kngl-render",
} as const;

/** Worker → realtime: oda durumu değişti, istemcilere yayınla. */
export const ROOM_EVENTS_CHANNEL = "kngl:room-events";

/** Ortak Redis anahtar üreticileri — çakışmayı önlemek için tek yerde. */
export const keys = {
  room: (code: string) => `room:${code}`,
  roomTakes: (code: string) => `room:${code}:takes`,
  roomLock: (code: string) => `room:${code}:lock`,
  rateLimit: (bucket: string, id: string) => `rl:${bucket}:${id}`,
  session: (token: string) => `sess:${token}`,
  cache: (name: string) => `cache:${name}`,
} as const;

/* ------------------------------------------------------------------ */
/* Saf yardımcılar                                                     */
/* ------------------------------------------------------------------ */

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  for (const ch of code) if (!ROOM_CODE_ALPHABET.includes(ch)) return false;
  return true;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Deterministik olmayan, tekrar eden ögesi olmayan karıştırma (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Karakterleri oyunculara rastgele dağıtır.
 * Oyuncu sayısı karakterden fazlaysa fazla oyuncular seyirci kalır (characterId=null).
 * Karakter sayısı oyuncudan fazlaysa oyuncular birden fazla karakter alır (round-robin);
 * bu durumda oyuncuya "birincil" karakter atanır ve replikler karaktere göre yönlendirilir.
 */
export function assignCharacters(
  players: readonly RoomPlayer[],
  characters: readonly SceneCharacter[],
  random: () => number = Math.random,
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const connected = players.filter((p) => p.connected);
  if (connected.length === 0 || characters.length === 0) return result;
  const shuffledPlayers = shuffle(connected, random);
  const shuffledChars = shuffle(characters, random);
  shuffledChars.forEach((c, i) => {
    const p = shuffledPlayers[i % shuffledPlayers.length];
    const list = result.get(p.id) ?? [];
    list.push(c.id);
    result.set(p.id, list);
  });
  return result;
}

/** Bir oyuncunun sorumlu olduğu replikler. */
export function linesForPlayer(
  scene: Pick<Scene, "lines">,
  characterIds: readonly string[],
): SceneLine[] {
  const set = new Set(characterIds);
  return scene.lines.filter((l) => set.has(l.characterId));
}

/** Tüm bağlı oyuncular repliklerini bitirdi mi? */
export function allLinesRecorded(
  room: Pick<RoomState, "players">,
  scene: Pick<Scene, "lines">,
  assignments: ReadonlyMap<string, string[]>,
): boolean {
  for (const player of room.players) {
    const chars = assignments.get(player.id) ?? [];
    if (chars.length === 0) continue;
    const required = linesForPlayer(scene, chars).map((l) => l.id);
    const done = new Set(player.completedLines);
    if (!required.every((id) => done.has(id))) return false;
  }
  return true;
}

/** Sunucu ve istemci arasındaki geçiş izinleri — tek doğruluk kaynağı. */
export const PHASE_TRANSITIONS: Record<RoomPhase, readonly RoomPhase[]> = {
  lobby: ["casting"],
  casting: ["recording", "lobby"],
  recording: ["rendering", "lobby"],
  rendering: ["done", "failed"],
  done: ["lobby"],
  failed: ["lobby"],
};

export function canTransition(from: RoomPhase, to: RoomPhase): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}
