import { prisma } from "@/lib/prisma";

import { ApprovalsClient } from "@/components/approvals-client";

export const dynamic = "force-dynamic";

function mapStatus(dbStatus: string): string {
  switch (dbStatus) {
    case "AWAITING_APPROVAL":
      return "承認待ち";
    case "APPROVED":
      return "承認済み";
    case "EDITED":
      return "編集承認済み";
    case "REJECTED":
      return "却下";
    case "FAILED":
      return "送信失敗";
    case "SENT":
      return "送信済み";
    case "CLAIMED":
      return "送信中";
    case "ARCHIVED":
      return "アーカイブ";
    default:
      return dbStatus;
  }
}

function riskFromFlags(riskFlags: string | null): "低リスク" | "中リスク" | "高リスク" {
  if (!riskFlags) return "低リスク";
  try {
    const arr = JSON.parse(riskFlags);
    if (Array.isArray(arr) && arr.length >= 2) return "高リスク";
    if (Array.isArray(arr) && arr.length === 1) return "中リスク";
  } catch {}
  return "低リスク";
}

export default async function ApprovalsPage() {
  const items = await prisma.approvalItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: true },
    take: 200,
  });

  const serialized = items.map((a) => ({
    id: a.id,
    company: a.lead?.company ?? "—",
    person: a.lead?.contactName ?? "",
    email: a.lead?.email ?? "",
    agent: (a.submittedBy ?? "—") as string,
    subject: a.subject,
    body: a.editedBody ?? a.body,
    rawBody: a.body,
    editedBody: a.editedBody,
    note: a.feedback ?? a.riskFlags ?? "",
    evidence: a.evidence ?? "",
    risk: riskFromFlags(a.riskFlags),
    riskFlags: a.riskFlags ? (() => { try { return JSON.parse(a.riskFlags); } catch { return []; } })() as string[] : [],
    time: a.createdAt.toISOString(),
    status: mapStatus(a.status) as "承認待ち" | "承認済み" | "編集承認済み" | "却下" | "送信失敗" | "送信済み" | "送信中" | "アーカイブ",
    dbStatus: a.status,
    lockedHash: a.lockedHash,
    hashMismatchAt: a.hashMismatchAt ? a.hashMismatchAt.toISOString() : null,
    feedback: a.feedback,
    claimedBy: a.claimedBy,
    messageId: a.messageId,
  }));

  return <ApprovalsClient initialItems={serialized} />;
}
