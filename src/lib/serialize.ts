// Prismaオブジェクト → クライアントコンポーネントに渡せるプレーンな形に変換
import type { ApprovalStatus } from "./approval-machine";

export interface SerializedApprovalItem {
  id: string;
  subject: string;
  body: string;
  editedBody: string | null;
  status: ApprovalStatus;
  evidence: string | null;
  riskFlags: string[];
  feedback: string | null;
  submittedBy: string | null;
  createdAt: string;
  approvedAt: string | null;
  lockedHash: string | null;
  hashMismatchAt: string | null;
  lead: { company: string; contactName: string | null; email: string } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeApprovalItem(item: any): SerializedApprovalItem {
  return {
    id: item.id,
    subject: item.subject,
    body: item.body,
    editedBody: item.editedBody,
    status: item.status as ApprovalStatus,
    evidence: item.evidence,
    riskFlags: item.riskFlags ? (JSON.parse(item.riskFlags) as string[]) : [],
    feedback: item.feedback,
    submittedBy: item.submittedBy,
    createdAt: item.createdAt.toISOString(),
    approvedAt: item.approvedAt ? item.approvedAt.toISOString() : null,
    lockedHash: item.lockedHash ?? null,
    hashMismatchAt: item.hashMismatchAt ? item.hashMismatchAt.toISOString() : null,
    lead: item.lead
      ? {
          company: item.lead.company,
          contactName: item.lead.contactName,
          email: item.lead.email,
        }
      : null,
  };
}

/** 相対時刻表示（例: 3分前） */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}日前`;
  return new Date(iso).toLocaleDateString("ja-JP");
}
