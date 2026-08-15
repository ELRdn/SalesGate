// SalesGate フォローアップスケジューラー
//
// 使い方:
//   pnpm scheduler          → 1回だけ実行
//   pnpm scheduler:watch    → 1時間ごとに実行（常駐プロセス）
//
// やること:
//   1. 未返信・期限経過リードへのフォローアップタスク生成
//   2. 承認待ちで放置された下書きの自動アーカイブ
//   3. タッチ上限到達リードの休眠移行
import { runFollowUpGeneration } from "../src/lib/followup.ts";
import { prisma } from "../src/lib/prisma.ts";

async function runOnce() {
  const result = await runFollowUpGeneration();
  console.log(
    `[${new Date().toISOString()}] ✅ フォローアップタスク: ${result.followUpTasksCreated}件生成 / アーカイブ: ${result.archivedApprovalItems}件 / 休眠移行: ${result.leadsMovedToSleeping}件`,
  );
}

const watch = process.argv.includes("--watch");
const INTERVAL_MS = 60 * 60 * 1000; // 1時間

async function main() {
  try {
    await runOnce();
  } catch (e) {
    console.error("[scheduler] エラー:", e);
  }
}

if (watch) {
  console.log("🕐 SalesGate スケジューラー起動（1時間ごとに実行）");
  await main();
  setInterval(main, INTERVAL_MS);
} else {
  await main();
  await prisma.$disconnect();
}
