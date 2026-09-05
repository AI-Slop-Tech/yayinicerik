#!/bin/sh
# Worker konteyneri açılışı: paylaşılan volume sahipliğini düzelt, sonra uygulama kullanıcısına düş.
set -e

if [ "$(id -u)" = "0" ]; then
  for d in "${UPLOAD_DIR:-/data/uploads}" "${SCENE_MEDIA_DIR:-/data/media/scenes}" \
           "${SOURCE_DIR:-/data/media/sources}" "${OUTPUT_DIR:-/data/media/dubs}"; do
    mkdir -p "$d" 2>/dev/null || true
  done
  chown -R kngl:kngl /data 2>/dev/null || echo "[entrypoint] uyarı: /data sahipliği düzeltilemedi"
  exec su-exec kngl "$0" "$@"
fi

exec "$@"
