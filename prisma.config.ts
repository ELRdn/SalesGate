// Prisma設定（driver adapter方式: schema-engine/query-engineのspawn不要）
// サンドボックス環境でもマイグレーション・クエリが動作する
import { defineConfig } from "prisma/config";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
  adapter: async () =>
    new PrismaBetterSQLite3({
      url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
    }),
});
