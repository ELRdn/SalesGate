// フォローアップスケジューラーの共有ロジック
// scripts/scheduler.ts（定期実行）と設定画面の「今すぐ実行」ボタンから使う
import { prisma } from "./prisma.ts";
import { getSettingInt } from "./settings.ts";

export interface FollowUpRunResult {
  followUpTasksCreated: number;
  archivedApprovalItems: number;
  leadsMovedToSleeping: number;
  checkedLeads: number;
}

/** フォローアップタスク生成 + 古い下書きのアーカイブ + 休眠移行 */
export async function runFollowUpGeneration(): Promise<FollowUpRunResult> {
  const delayDays = await getSettingInt("followup_delay_days", 3);
  const maxTouches = await getSettingInt("max_touches", 3);
  const archiveDays = await getSettingInt("archive_after_days", 7);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1) フォローアップ: 最終タッチから delayDays 経過・未返信・タッチ数未満のリードに追撃タスク
  const due = new Date(now.getTime() - delayDays * dayMs);
  const leads = await prisma.lead.findMany({
    where: {
      status: "ACTIVE",
      lastTouchAt: { lte: due },
      touchCount: { lt: maxTouches },
    },
  });

  let created = 0;
  for (const lead of leads) {
    // 既に未完了のフォローアップタスクがある場合はスキップ（重複防止）
    const existing = await prisma.task.findFirst({
      where: {
        leadId: lead.id,
        type: "FOLLOW_UP",
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });
    if (existing) continue;
    await prisma.task.create({
      data: {
        type: "FOLLOW_UP",
        title: `フォローアップ #${lead.touchCount + 1}: ${lead.company}`,
        description: `前回送信から${delayDays}日経過・未返信です。追撃メールの下書きを作成し submit_draft で承認キューに提出してください。`,
        leadId: lead.id,
        dueAt: now,
      },
    });
    created++;
  }

  // 2) 古い承認待ちの自動アーカイブ（送信されない）
  const archiveBefore = new Date(now.getTime() - archiveDays * dayMs);
  const archived = await prisma.approvalItem.updateMany({
    where: { status: "AWAITING_APPROVAL", createdAt: { lte: archiveBefore } },
    data: { status: "ARCHIVED", archivedAt: now },
  });

  // 3) タッチ上限到達かつ期限経過のリードを休眠に移行
  const exhausted = await prisma.lead.updateMany({
    where: {
      status: "ACTIVE",
      touchCount: { gte: maxTouches },
      lastTouchAt: { lte: due },
    },
    data: { status: "SLEEPING" },
  });

  return {
    followUpTasksCreated: created,
    archivedApprovalItems: archived.count,
    leadsMovedToSleeping: exhausted.count,
    checkedLeads: leads.length,
  };
}
