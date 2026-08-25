import { prisma } from "@/lib/prisma";
import { HistoryClient } from "@/components/history-client";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await prisma.messageLog.findMany({ orderBy: { sentAt: "desc" }, include: { lead: true, approvalItem: true }, take: 500 });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = logs.filter((l) => new Date(l.sentAt) >= startOfDay).length;
  const sentCount = logs.filter((l) => l.status === "SENT").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const mismatchCount = await prisma.approvalItem.count({ where: { hashMismatchAt: { not: null } } });
  const successRate = logs.length > 0 ? ((sentCount / logs.length) * 100).toFixed(1) + "%" : "—";
  const serialized = logs.map((l) => ({
    id: l.id,
    company: l.lead?.company ?? "—",
    email: l.lead?.email ?? "—",
    subject: l.subject,
    agent: l.sentBy ?? "—",
    status: (() => {
      if (l.status === "SENT") {
        if (l.approvalItem?.hashMismatchAt) return "本文不一致";
        return "送信済み";
      }
      return "送信失敗";
    })(),
    hash: (() => {
      if (l.approvalItem?.hashMismatchAt) return "不一致";
      if (l.approvalItem?.lockedHash) return "一致";
      return "未検証";
    })(),
    sentAt: l.sentAt.toISOString(),
    sentAtLabel: new Date(l.sentAt).toLocaleString("ja-JP"),
    messageId: l.messageId ?? "—",
  }));
  return <HistoryClient initialLogs={serialized} metrics={{ todayCount, successRate, failedCount, mismatchCount }} />;
}
