# ---- bağımlılıklar ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/realtime/package.json apps/realtime/
COPY apps/worker/package.json apps/worker/
RUN npm ci --no-audit --no-fund

# ---- derleme ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
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
USER kngl
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "apps/web/server.js"]
