FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/realtime/package.json apps/realtime/
COPY apps/worker/package.json apps/worker/
# --ignore-scripts: postinstall (shared derlemesi) bu aşamada kaynak olmadığı için çalışmamalı; build aşamasında derlenir.
RUN npm ci --no-audit --no-fund --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @kngl/shared && npm run build -w @kngl/realtime

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN addgroup -g 10001 -S kngl && adduser -u 10001 -S kngl -G kngl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/realtime/dist ./apps/realtime/dist
COPY apps/realtime/package.json ./apps/realtime/
COPY package.json ./
USER kngl
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1:4000/healthz || exit 1
CMD ["node", "apps/realtime/dist/index.js"]
