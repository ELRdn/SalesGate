// PrismaClient シングルトン（driver adapter方式）
// better-sqlite3 adapter を使うことで query-engine バイナリの spawn が不要になり、
// サンドボックス環境・サーバーレス環境でも動作する
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  // Docker等では DATABASE_URL=file:/data/salesgate.db を優先（永続ボリューム）
  const dbUrl = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  const adapter = new PrismaBetterSQLite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
