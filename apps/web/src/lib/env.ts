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
  /** Postgres bağlantı havuzu: her web replikası için üst sınır. */
  PG_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DISCORD_INVITE_URL: z.string().default("https://discord.gg/kngl"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Geçersiz ortam değişkenleri:\n${issues}`);
  }
  // `next build` sırasında (NEXT_PHASE=phase-production-build) gizli anahtar gerekmez;
  // üretimde sunucu ayağa kalkarken zorunlu.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (!isBuild && parsed.data.NODE_ENV === "production" && parsed.data.SESSION_SECRET.startsWith("dev-only")) {
    throw new Error("SESSION_SECRET üretimde mutlaka ayarlanmalı.");
  }
  cached = parsed.data;
  return cached;
}
