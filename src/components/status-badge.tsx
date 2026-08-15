// ステータスバッジと色マップ
import type { ApprovalStatus } from "@/lib/approval-machine";

export type BadgeColor =
  | "amber"
  | "emerald"
  | "sky"
  | "red"
  | "rose"
  | "zinc"
  | "green";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  sky: "bg-sky-500/10 text-sky-400 ring-sky-500/30",
  red: "bg-red-500/10 text-red-400 ring-red-500/30",
  rose: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  zinc: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/30",
  green: "bg-green-500/10 text-green-400 ring-green-500/30",
};

export function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}

export const APPROVAL_STATUS_COLOR: Record<ApprovalStatus, BadgeColor> = {
  AWAITING_APPROVAL: "amber",
  APPROVED: "emerald",
  EDITED: "green",
  REJECTED: "red",
  CLAIMED: "sky",
  SENT: "green",
  FAILED: "rose",
  ARCHIVED: "zinc",
};

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  AWAITING_APPROVAL: "承認待ち",
  APPROVED: "承認済み",
  EDITED: "編集承認済み",
  REJECTED: "却下",
  CLAIMED: "送信待ち(claim済)",
  SENT: "送信済み",
  FAILED: "送信失敗",
  ARCHIVED: "アーカイブ",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <Badge color={APPROVAL_STATUS_COLOR[status]}>{APPROVAL_STATUS_LABEL[status]}</Badge>;
}

export const LEAD_STATUS_COLOR: Record<string, BadgeColor> = {
  ACTIVE: "emerald",
  RESPONDED: "sky",
  SLEEPING: "zinc",
  SUPPRESSED: "red",
};

export const LEAD_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "アクティブ",
  RESPONDED: "返信あり",
  SLEEPING: "休眠",
  SUPPRESSED: "抑制中",
};

export const TASK_STATUS_COLOR: Record<string, BadgeColor> = {
  PENDING: "amber",
  IN_PROGRESS: "sky",
  DONE: "emerald",
  CANCELLED: "zinc",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
  CANCELLED: "キャンセル",
};

export const TASK_TYPE_LABEL: Record<string, string> = {
  FOLLOW_UP: "フォローアップ",
  RESEARCH: "リサーチ",
  REVIEW_REQUEST: "事前相談",
  CUSTOM: "カスタム",
};
