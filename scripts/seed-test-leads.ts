// SalesGate — テスト用リードシード（MCP疎通確認用）
// 実行: node scripts/seed-test-leads.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// .example.com はテスト用予約ドメイン（実際には送信されない）
const testLeads = [
  {
    company: "株式会社アルファ製作所",
    contactName: "佐藤太郎",
    email: "satou@alpha-mfg.example.com",
    notes: "テスト用リード（MCP疎通確認用）",
  },
  {
    company: "ベータ商事株式会社",
    contactName: "鈴木花子",
    email: "suzuki@beta-shouji.example.com",
    notes: "テスト用リード（MCP疎通確認用）",
  },
  {
    company: "ガンマテック株式会社",
    contactName: "田中健一",
    email: "tanaka@gamma-tech.example.com",
    notes: "テスト用リード（MCP疎通確認用）",
  },
];

async function main() {
  for (const lead of testLeads) {
    await prisma.lead.upsert({
      where: { email: lead.email },
      update: {},
      create: lead,
    });
  }
  const count = await prisma.lead.count();
  console.log(`✅ テストリードを投入しました（現在の総リード数: ${count}）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
