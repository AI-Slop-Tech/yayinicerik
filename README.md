# KNGL Dublaj

Ekibinle sahne seslendirme oyunu: bir sahne seç, altı haneli ekip kodunu paylaş, roller kura ile dağıtılsın,
herkes kendi repliğini kaydetsin, bütün sesler tek bir "prömiyer" videosunda birleşsin.

Tarayıcıda çalışır, kurulum istemez. Açık, sıcak "kağıt" temalı editöryal bir arayüz; oyun ekranı koyu stüdyo temasına geçer. Türkçe.

Tasarım ve metinler özgündür: bölüm yapısı, adım anlatımı, üyelik modeli (KNGL Plus), renk paleti, yazı tipleri, logo ve afişler
bu projeye özel üretilmiştir; başka bir siteden kopyalanmış görsel, metin ya da medya içermez.

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

Compose dosyaları host portu bağlamaz (`expose: 80`); önündeki proxy (Coolify, Traefik, Caddy) nginx'e yönlendirir. Proxy'siz bir sunucuda
`cp docker-compose.override.example.yml docker-compose.override.yml` ile 80 portunu dışarı açabilirsin.

TLS: nginx'in önüne Caddy/Traefik ya da bulut yük dengeleyici koy; `X-Forwarded-Proto` iletilir.

### Coolify ile dağıtım

**Seçenek A — Docker Compose (tam oyun, önerilen).** Web, realtime, worker, Postgres ve Redis tek seferde kurulur.

1. Coolify → **New Resource → Docker Compose**, depo: `AI-Slop-Tech/yayinicerik`, dal: `main`.
2. **Docker Compose Location** alanına `/docker-compose.coolify.yml` yaz. Bu dosya host portu bağlamaz (Coolify'ın proxy'siyle çakışmaz)
   ve gizli değerleri (`SESSION_SECRET`, Postgres şifresi) Coolify'ın magic değişkenleriyle otomatik üretir.
3. `nginx` servisine alan adını tanımla (ör. `https://kngldublaj.com`). `SERVICE_URL_NGINX` bu değerden dolar.
4. Deploy. İlk derleme 4 imaj (nginx, web, realtime, worker) ürettiği için 5–10 dakika sürebilir; `migrate` servisi şemayı ve
   örnek kataloğu bir kez yükleyip biter.
5. Sahne videolarını `media` volume'una, `scenes/<slug>.mp4` yoluyla kopyala.

**Seçenek B — Railpack / Nixpacks (yalnızca web).** Coolify'ın varsayılan "Application" kaynağı depoyu tek Node uygulaması olarak
derler; kökteki `npm run build` ve `npm start` bunun için hazırdır (port 3000). Ancak bu yolda Postgres, Redis, realtime ve worker
ayrı ayrı kurulmalıdır:

1. Coolify'da bir **PostgreSQL** ve bir **Redis** kaynağı oluşturun.
2. Web uygulamasına şu ortam değişkenlerini verin: `SESSION_SECRET` (≥32 karakter), `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_REALTIME_URL` (realtime uygulamasının adresi).
3. Şemayı bir kez yükleyin: `DATABASE_URL=... npm run db:migrate && npm run db:seed`.
4. Realtime için ikinci bir Application açın (start: `npm run start -w @kngl/realtime`, port 4000, aynı `SESSION_SECRET`);
   worker için üçüncüsü (start: `npm run start -w @kngl/worker`, imajda ffmpeg gerekir).

Bu yolda web tek başına açılır ve `/durum` sayfası hangi bağımlılığın eksik olduğunu gösterir; oyun akışı realtime + worker olmadan tamamlanmaz.

Yazı tipleri repoya gömülüdür (`apps/web/src/fonts`), derleme sırasında internet gerekmez.

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
