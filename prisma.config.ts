// Prisma設定（driver adapter方式: query-engineのspawn不要）
// 注意: migrate 実行時は adapter を外す（adapter経由のmigrateはdiff検出に問題があるため）
import { defineConfig } from "prisma/config";

// ローカル開発では DATABASE_URL 未設定時に file:./dev.db をデフォルトとする
// schema.prisma が prisma/ 配下にあるため、file:./dev.db は prisma/dev.db を指す
// file:./prisma/dev.db にすると prisma/prisma/dev.db に解決されてしまうため注意
// Dockerでは compose の DATABASE_URL=file:/data/salesgate.db が優先される
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
});
