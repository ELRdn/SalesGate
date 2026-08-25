// PrismaClient シングルトン（driver adapter方式）
// better-sqlite3 adapter を使うことで query-engine バイナリの spawn が不要になり、
// サンドボックス環境・サーバーレス環境でも動作する
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDbUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw;
  const p = raw.slice(5);
  // 既に絶対パス (/ または C:/) ならそのまま
  // Turbopackがpathを静的解析できないため ignore コメントを付与
  if (path.isAbsolute(/* turbopackIgnore: true */ p) || /^[A-Za-z]:\//.test(p)) return raw;
  // 相対パスは cwd 基準で絶対化して adapter と migrate で一致させる
  // file:./dev.db や file:./prisma/dev.db などを正しく解決
  const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), p).replace(/\\/g, "/");
  return `file:${abs}`;
}

function createClient(): PrismaClient {
  // Docker等では DATABASE_URL=file:/data/salesgate.db を優先（永続ボリューム）
  const rawUrl =
    process.env.DATABASE_URL ??
    `file:${path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")}`;
  const dbUrl = resolveDbUrl(rawUrl);
  const adapter = new PrismaBetterSQLite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
