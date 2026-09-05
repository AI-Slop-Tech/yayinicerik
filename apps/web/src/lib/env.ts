import { z } from "zod";

/**
 * Ortam değişkenleri tek yerde doğrulanır; eksik/yanlış değer uygulama açılırken patlar,
 * üretimde saatler sonra değil.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().default("postgres://kngl:kngl@localhost:5432/kngl"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  /** Oturum ve misafir çerezlerini imzalamak için (≥32 karakter). */
  SESSION_SECRET: z.string().min(32).default("dev-only-secret-change-me-in-production-please-0000"),
  /** Tarayıcının bağlanacağı realtime (Socket.IO) adresi. Boşsa aynı origin + /socket.io */
  NEXT_PUBLIC_REALTIME_URL: z.string().default(""),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  /** Kayıtların yazıldığı dizin (web ve worker arasında paylaşılan volume). */
  UPLOAD_DIR: z.string().default("./data/uploads"),
  /** Üretilen videoların dışarıya servis edildiği taban adres. */
  MEDIA_BASE_URL: z.string().default("/media"),
  /** Sahne videoları (scenes/), afişler (thumbs/) ve final videolar (dubs/) için kök dizin. */
  MEDIA_DIR: z.string().default("./data/media"),
  /** Yönetim paneli şifresi. Boşsa panel kapalıdır. */
  ADMIN_PASSWORD: z.string().optional(),
  /** Kaynak videoların toplamda kaplayabileceği en fazla alan (GB). Disk kısıtlı sunucular için. */
  MAX_SOURCE_GB: z.coerce.number().min(0.5).max(500).default(5),
  /** Postgres bağlantı havuzu: her web replikası için üst sınır. */
  PG_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DISCORD_INVITE_URL: z.string().default("https://discord.gg/kngl"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/**
 * Boş string = tanımsız. Docker/Coolify gibi platformlar tanımlanmamış build-arg'ları "" olarak geçer;
 * bunlar varsayılana düşmeli, doğrulamayı düşürmemeli.
 */
function readRawEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) out[k] = v === "" ? undefined : v;
  return out;
}

export function env(): Env {
  if (cached) return cached;
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const parsed = schema.safeParse(readRawEnv());
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    if (!isBuild) throw new Error(`Geçersiz ortam değişkenleri:\n${issues}`);
    // `next build` sırasında gerçek değerler gerekmez (veri çekilmez); varsayılanlarla devam et.
    console.warn(`[env] derleme sırasında geçersiz değerler yok sayıldı:\n${issues}`);
    cached = schema.parse({});
    return cached;
  }
  // Üretimde sunucu ayağa kalkarken gizli anahtar zorunlu; derleme sırasında değil.
  if (!isBuild && parsed.data.NODE_ENV === "production" && parsed.data.SESSION_SECRET.startsWith("dev-only")) {
    throw new Error("SESSION_SECRET üretimde mutlaka ayarlanmalı.");
  }
  cached = parsed.data;
  return cached;
}
