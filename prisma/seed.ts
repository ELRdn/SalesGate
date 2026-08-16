// SalesGate — 初期設定シード
// 実行: pnpm prisma:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaults: Record<string, string> = {
  // 日次送信上限（デリバビリティ保護）
  daily_send_limit: "10",
  // フォローアップ: 未返信から何日後に追撃するか
  followup_delay_days: "3",
  // 最大タッチ数（超えたらSLEEPING）
  max_touches: "3",
  // 承認されず放置された下書きをアーカイブする日数
  archive_after_days: "7",
  // Slack Webhook URL（空なら通知無効）
  slack_webhook_url: "",
};

async function main() {
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("✅ 初期設定を投入しました:", Object.keys(defaults).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
