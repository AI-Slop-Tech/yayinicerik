# KNGL Dublaj

Arkadaşlarınla online dublaj oyunu: bir oda kur, altı haneli kodu paylaş, sunucu karakterleri rastgele dağıtsın,
herkes kendi repliklerini kaydetsin, bütün sesler tek bir final videoda birleşsin.

Tarayıcıda çalışır, kurulum istemez. Koyu, stüdyo hissi veren bir arayüz; Türkçe.

## Mimari

```
                 ┌──────────── nginx (kenar) ────────────┐
 tarayıcı ──────▶│ statik/medya · mikro-önbellek · limit  │
                 └───────┬───────────────────┬───────────┘
                         │ HTTP              │ WebSocket
                 ┌───────▼───────┐   ┌───────▼────────┐
                 │ web ×N        │   │ realtime ×M     │
                 │ Next.js 16    │   │ Socket.IO       │
                 │ (durumsuz)    │   │ + Redis adapter │
                 └──┬───────┬────┘   └───┬─────────────┘
                    │       │            │
              ┌─────▼──┐ ┌──▼────────────▼──┐     ┌─────────────┐
              │Postgres│ │      Redis        │◀───▶│ worker ×K   │
              │katalog │ │ odalar · oturum   │     │ BullMQ +    │
              │kullanıcı│ │ önbellek · kuyruk │     │ ffmpeg      │
              └────────┘ └───────────────────┘     └─────────────┘
```

| Paket | Görev |
| --- | --- |
| `apps/web` | Next.js 16 (App Router, Tailwind v4). Sayfalar, API uçları, kimlik, oda yaratma, kayıt yükleme. |
| `apps/realtime` | Socket.IO sunucusu. Oda durum makinesi, karakter dağıtımı, ilerleme, render tetikleme. |
| `apps/worker` | BullMQ tüketicisi. Kayıtları ffmpeg ile sahne videosuna karıştırır, filigran/1080p uygular, sonucu kaydeder. |
| `packages/shared` | Ortak tipler, olay adları, Redis anahtarları, saf oda mantığı (`assignCharacters`, `canTransition`…). |
| `infra/` | nginx yapılandırması, veritabanı migrasyonları ve seed. |

## Yük altında ayakta kalma (10.000+ eşzamanlı kullanıcı)

Tasarım ilkesi: **hiçbir istek, önbellekten karşılanabiliyorsa veritabanına gitmez; hiçbir servis tek kopya değildir.**

- **Durumsuz web replikaları** — oturum Redis'te, dosyalar paylaşılan volume'da; `--scale web=8` ile büyür.
- **Üç katmanlı önbellek** — nginx mikro-önbelleği (anonim HTML, 30 sn, `proxy_cache_lock` ile stampede koruması) → süreç içi bellek (2 sn) → Redis (60–300 sn). Katalog sorguları dakikada bir kez DB'ye iner. Eşzamanlı istekler tek üreticide birleşir (request coalescing).
- **Hız sınırları** — nginx `limit_req` (genel 30 r/s, API 10 r/s, kimlik 2 r/s) + uygulama içi Redis sayaçları (oda kurma, giriş, yükleme). Redis düşerse sınır "fail-open" çalışır, site durmaz.
- **Realtime yatay ölçek** — Socket.IO Redis adapter ile M replika aynı odaları görür; WebSocket öncelikli taşıma, `ip_hash` ile yapışkanlık. Oda mutasyonları Redis kilidiyle atomik. Soket başına olay limiti (20/sn), 64 KB mesaj sınırı; ses dosyaları soket üzerinden **geçmez**, HTTP'den yüklenir.
- **Render izolasyonu** — ffmpeg işi web sürecinde değil ayrı worker'larda; kuyruk BullMQ (yeniden deneme, stall devralma, VIP önceliği). Worker düşse iş kaybolmaz.
- **Bağlantı havuzları ve zaman aşımları** — pg pool replika başına 10, `statement_timeout` 10 sn; Redis yeniden bağlanma stratejisi; ffmpeg 5 dk üst sınır.
- **Sağlık ve zarif kapanış** — `/api/health`, `/healthz`; SIGTERM'de soketler ve kuyruklar düzgün kapanır; nginx sağlıksız replikayı havuzdan çıkarır.
- **Statik varlıklar** — içerik adresli `_next/static` sonsuz önbellek; medya nginx'ten `sendfile` ile doğrudan; SVG afişler bağımlılıksız.
- **Güvenlik** — HMAC imzalı kimlik belirteçleri (web ↔ realtime aynı gizli anahtar), bcrypt, `httpOnly` çerezler, güvenlik başlıkları, zod doğrulama, dosya adı/uzantı beyaz listesi.

Kaba kapasite (4 vCPU / 8 GB tek makine, docker-compose varsayılanları): ~10k eşzamanlı ziyaretçi (çoğu anonim HTML → nginx önbelleği), ~2k eşzamanlı soket, ~4 paralel render. Daha fazlası için replikaları artır ve Postgres/Redis'i yönetilen servise taşı; kod değişikliği gerekmez.

## Yerel geliştirme

Gereksinimler: Node 22+, PostgreSQL 16, Redis 7, ffmpeg (yalnızca worker için).

```bash
npm install
cp .env.example .env            # yerelde DATABASE_URL/REDIS_URL'yi localhost yap
export DATABASE_URL=postgres://kngl:kngl@localhost:5432/kngl REDIS_URL=redis://localhost:6379
npm run db:migrate && npm run db:seed
npm run build -w @kngl/shared
npm run dev:web        # http://localhost:3000
npm run dev:realtime   # ws://localhost:4000  (NEXT_PUBLIC_REALTIME_URL=http://localhost:4000)
npm run dev:worker
```

Sahne kaynak videoları `data/media/scenes/<slug>.mp4` altına konur (katalogdaki `video_url` ile eşleşir).
Video olmadan da oyun akışı çalışır: kayıt bileşeni süre tabanlı geri sayıma düşer; render için kaynak video gerekir.

## Üretim

```bash
cp .env.example .env && $EDITOR .env      # SESSION_SECRET ve NEXT_PUBLIC_SITE_URL zorunlu
docker compose up -d --build
docker compose up -d --scale web=4 --scale realtime=2 --scale worker=3   # ölçekle
```

TLS: nginx'in önüne Caddy/Traefik ya da bulut yük dengeleyici koy; `X-Forwarded-Proto` iletilir.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run build` | Tüm paketleri derler |
| `npm run typecheck` | Tüm paketlerde tip denetimi |
| `npm run lint` | ESLint (web) |
| `npm run db:migrate` / `db:seed` | Şema ve örnek katalog |
| `node scripts/gen-thumbs.mjs` | Seed sahneleri için SVG afişleri üretir |
| `node scripts/smoke-realtime.mjs` | Realtime oda akışı duman testi (Redis + Postgres + realtime gerekir) |

## Dizin yapısı

```
apps/web/src/app          sayfalar ve API uçları (Türkçe rotalar: /sahneler, /oda/[code], /fiyatlandirma …)
apps/web/src/components   arayüz bileşenleri (room/ altında oyun istemcisi ve kayıt bileşeni)
apps/web/src/lib          env, db, redis, cache, rate-limit, auth, rooms, scenes, dubs, storage
apps/realtime/src         Socket.IO sunucusu, oda deposu (Redis kilidi), kimlik doğrulama
apps/worker/src           BullMQ worker ve ffmpeg filtre grafiği
packages/shared/src       ortak tipler ve saf oda mantığı
infra/db/migrations       SQL migrasyonları · infra/db/seed katalog · infra/nginx kenar yapılandırması
```
