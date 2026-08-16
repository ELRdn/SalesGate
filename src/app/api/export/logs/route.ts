// 送信履歴のCSVエクスポート
// http://localhost:3000/api/export/logs でダウンロード（Excel対応: BOM付きUTF-8）
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const logs = await prisma.messageLog.findMany({
    orderBy: { sentAt: "desc" },
    include: { lead: true },
    take: 5000,
  });

  const header = ["送信日時", "会社名", "担当者", "メール", "件名", "状態", "Message-ID", "送信者", "エラー"];
  const rows = logs.map((l) => [
    l.sentAt.toISOString(),
    l.lead?.company ?? "",
    l.lead?.contactName ?? "",
    l.lead?.email ?? "",
    l.subject,
    l.status,
    l.messageId ?? "",
    l.sentBy ?? "",
    l.error ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="salesgate-send-logs.csv"',
    },
  });
}
