#!/bin/sh
# Web konteyneri açılışı.
#  1. Paylaşılan volume'ların sahipliğini düzelt (root iken), sonra uygulama kullanıcısına düş.
#     Named volume'lar ilk oluşturuldukları andaki sahipliği korur; imaj kullanıcısı sonradan
#     değişirse yazma izni kaybolur ve yüklemeler sessizce başarısız olur.
#  2. Şema migrasyonu ve ilk seed (RUN_MIGRATIONS=0 ile atlanır).
#  3. Sunucuyu başlat.
set -e

if [ "$(id -u)" = "0" ]; then
  for d in "${UPLOAD_DIR:-/data/uploads}" "${MEDIA_DIR:-/data/media}"; do
    mkdir -p "$d" 2>/dev/null || true
    chown -R kngl:kngl "$d" 2>/dev/null || echo "[entrypoint] uyarı: $d sahipliği düzeltilemedi"
  done
  mkdir -p "${MEDIA_DIR:-/data/media}/scenes" "${MEDIA_DIR:-/data/media}/thumbs" \
           "${MEDIA_DIR:-/data/media}/dubs" "${MEDIA_DIR:-/data/media}/sources" 2>/dev/null || true
  chown -R kngl:kngl "${MEDIA_DIR:-/data/media}" 2>/dev/null || true
  exec su-exec kngl "$0" "$@"
fi

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] migrasyon çalışıyor..."
  node scripts/migrate.mjs
  echo "[entrypoint] seed kontrolü..."
  node scripts/seed.mjs
fi

exec "$@"
