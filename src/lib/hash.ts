// 本文ハッシュ照合ユーティリティ
// 承認原文 = 送信内容の保証（v0.3-1）
// 承認時に件名＋本文のSHA-256をロックし、送信報告時に実際に送信した本文と照合する
import { createHash } from "node:crypto";

/** 照合対象の正規化（改行差の吸収のみ。内容は変えない） */
export function normalizeEmailBody(subject: string, body: string): string {
  const s = subject.replace(/\r\n/g, "\n").trim();
  const b = body.replace(/\r\n/g, "\n").trim();
  return `${s}\n\n${b}`;
}

/** 件名＋本文のSHA-256ハッシュ（hex） */
export function hashEmailBody(subject: string, body: string): string {
  return createHash("sha256").update(normalizeEmailBody(subject, body), "utf8").digest("hex");
}

/** 送信本文が承認原文と一致するか照合（lockedHash が無い場合は null = 照合対象外） */
export function verifyEmailBody(
  lockedHash: string | null | undefined,
  approvedSubject: string,
  sentBody: string,
): boolean | null {
  if (!lockedHash) return null;
  return hashEmailBody(approvedSubject, sentBody) === lockedHash;
}
