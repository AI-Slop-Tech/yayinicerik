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
RUN npm run build -w @kngl/shared && npm run build -w @kngl/worker

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# ffmpeg + drawtext için yazı tipi
RUN apk add --no-cache ffmpeg ttf-dejavu && addgroup -g 10001 -S kngl && adduser -u 10001 -S kngl -G kngl \
 && mkdir -p /data/uploads /data/media/scenes /data/media/thumbs /data/media/dubs && chown -R kngl:kngl /data
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY apps/worker/package.json ./apps/worker/
COPY package.json ./
USER kngl
CMD ["node", "apps/worker/dist/index.js"]
