export const env = {
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  DATABASE_URL: process.env.DATABASE_URL ?? "postgres://kngl:kngl@localhost:5432/kngl",
  /** Web ile paylaşılan yükleme dizini (take dosyaları burada). */
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "./data/uploads",
  /** Sahne kaynak videolarının bulunduğu dizin (video_url'deki dosya adıyla eşleşir). */
  SCENE_MEDIA_DIR: process.env.SCENE_MEDIA_DIR ?? "./data/media/scenes",
  /** Final videoların yazıldığı dizin; nginx bunu /media/dubs olarak servis eder. */
  OUTPUT_DIR: process.env.OUTPUT_DIR ?? "./data/media/dubs",
  /** Tarayıcının final videoyu göreceği taban URL. */
  MEDIA_BASE_URL: process.env.MEDIA_BASE_URL ?? "/media",
  FFMPEG_PATH: process.env.FFMPEG_PATH ?? "ffmpeg",
  FFPROBE_PATH: process.env.FFPROBE_PATH ?? "ffprobe",
  /** Yönetim panelinden yüklenen kaynak videoların geçici dizini. */
  SOURCE_DIR: process.env.SOURCE_DIR ?? "./data/media/sources",
  /** Sahne videosu kalitesi. Büyükse dosya küçük olur; 23 net, 28 idareli. */
  SCENE_CRF: Number(process.env.SCENE_CRF ?? 26),
  /** Prömiyer videoları kaç gün saklanır (öne çıkarılanlar hariç). */
  DUB_RETENTION_DAYS: Number(process.env.DUB_RETENTION_DAYS ?? 30),
  /** Kullanılmayan kaynak videolar kaç saat sonra silinir. */
  SOURCE_TTL_HOURS: Number(process.env.SOURCE_TTL_HOURS ?? 24),
  /** Aynı anda kaç render (CPU çekirdeği sayısına göre ayarla). */
  CONCURRENCY: Number(process.env.RENDER_CONCURRENCY ?? 2),
  WATERMARK_TEXT: process.env.WATERMARK_TEXT ?? "KNGL Dublaj",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};
