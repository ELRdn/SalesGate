# SalesGate v0.4 — Dockerfile (Node 26 + better-sqlite3)
FROM node:26-slim AS base
WORKDIR /app

# better-sqlite3 のネイティブビルドに必要
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# 依存関係（cache効率のため先にコピー）
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# ソース
COPY . .

# Prisma Client 生成
RUN pnpm prisma:generate

# Next.js ビルド
RUN pnpm build

EXPOSE 3000
ENV NODE_ENV=production
# SQLite を /data に永続化（composeでvolumeマウント）
ENV DATABASE_URL="file:/data/salesgate.db"
CMD ["pnpm", "start"]
