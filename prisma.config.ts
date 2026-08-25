// Prisma設定（driver adapter方式: query-engineのspawn不要）
// 注意: migrate 実行時は adapter を外す（adapter経由のmigrateはdiff検出に問題があるため）
import { defineConfig } from "prisma/config";
import path from "node:path";

// ローカル開発では DATABASE_URL 未設定時に prisma/dev.db をデフォルトとする
// 必ず絶対パスで file: URL を生成し、migrateとruntimeで同じファイルを指すようにする
// 相対 file:./dev.db は Prisma(migrate)とadapterで解決基準が異なるため絶対パスで統一
// Dockerでは compose の DATABASE_URL=file:/data/salesgate.db が優先される
if (!process.env.DATABASE_URL) {
  const abs = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${abs}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
});
