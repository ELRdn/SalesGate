// Prisma設定（driver adapter方式: query-engineのspawn不要）
// 注意: migrate 実行時は adapter を外す（adapter経由のmigrateはdiff検出に問題があるため）
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
});
