# ---- bağımlılıklar ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/realtime/package.json apps/realtime/
COPY apps/worker/package.json apps/worker/
# --ignore-scripts: postinstall (shared derlemesi) bu aşamada kaynak olmadığı için çalışmamalı; build aşamasında derlenir.
RUN npm ci --no-audit --no-fund --ignore-scripts

# ---- derleme ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @kngl/shared && npm run build -w @kngl/web

# ---- çalışma ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S kngl && adduser -S kngl -G kngl && mkdir -p /data/uploads && chown -R kngl:kngl /data
COPY --from=build --chown=kngl:kngl /app/apps/web/.next/standalone ./
COPY --from=build --chown=kngl:kngl /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=kngl:kngl /app/apps/web/public ./apps/web/public
# Açılışta migrasyon + ilk seed (ayrı bir tek seferlik konteyner gerekmez; Coolify durumu temiz kalır)
COPY --chown=kngl:kngl scripts/migrate.mjs scripts/seed.mjs ./scripts/
COPY --chown=kngl:kngl infra/db ./infra/db
COPY --chown=kngl:kngl apps/web/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
USER kngl
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
