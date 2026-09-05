#!/bin/sh
# Web konteyneri açılışı: şema migrasyonu ve ilk seed, sonra sunucu.
# RUN_MIGRATIONS=0 verilirse atlanır (ör. ayrı bir işle yönetiliyorsa).
set -e
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] migrasyon çalışıyor..."
  node scripts/migrate.mjs
  echo "[entrypoint] seed kontrolü..."
  node scripts/seed.mjs
fi
exec "$@"
