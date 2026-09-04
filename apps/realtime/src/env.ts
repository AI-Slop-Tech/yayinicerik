export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-only-secret-change-me-in-production-please-0000",
  /** Virgülle ayrılmış izinli origin listesi; boşsa hepsi (yalnızca geliştirme). */
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  /** Sahne verisini okumak için web API tabanı (worker gibi DB'ye bağlanmak yerine). */
  DATABASE_URL: process.env.DATABASE_URL ?? "postgres://kngl:kngl@localhost:5432/kngl",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

if (env.NODE_ENV === "production" && env.SESSION_SECRET.startsWith("dev-only")) {
  throw new Error("SESSION_SECRET üretimde ayarlanmalı (web ile aynı değer).");
}
