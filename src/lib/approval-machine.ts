// 承認アイテムの状態遷移ロジック（純関数・テスト対象）
// Prismaに依存しないように自前の型を使う

export type ApprovalStatus =
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "EDITED"
  | "REJECTED"
  | "CLAIMED"
  | "SENT"
  | "FAILED"
  | "ARCHIVED";

// 遷移テーブル:
// AWAITING_APPROVAL → APPROVED / EDITED / REJECTED / ARCHIVED
// APPROVED / EDITED → CLAIMED（エージェントがclaim）/ ARCHIVED
// CLAIMED → SENT / FAILED（送信結果報告）
// FAILED → CLAIMED（エージェントが直接再試行）/ APPROVED（人間が再送信を許可）
export const APPROVAL_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  AWAITING_APPROVAL: ["APPROVED", "EDITED", "REJECTED", "ARCHIVED"],
  APPROVED: ["CLAIMED", "ARCHIVED"],
  EDITED: ["CLAIMED", "ARCHIVED"],
  CLAIMED: ["SENT", "FAILED"],
  FAILED: ["CLAIMED", "APPROVED", "ARCHIVED"],
  REJECTED: [],
  SENT: [],
  ARCHIVED: [],
};

/** 遷移可能かどうか */
export function canTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 遷移を検証。不正なら例外を投げる（送信経路の安全弁） */
export function assertTransition(from: ApprovalStatus, to: ApprovalStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`不正な状態遷移: ${from} → ${to}`);
  }
}

/** エージェントが送信（claim）できる状態か: 承認済み（編集済み含む）のみ */
export function isSendable(status: ApprovalStatus): boolean {
  return status === "APPROVED" || status === "EDITED";
}

/** 人間の決定で遷移できる状態か */
export function isHumanDecidable(status: ApprovalStatus): boolean {
  return status === "AWAITING_APPROVAL";
}
