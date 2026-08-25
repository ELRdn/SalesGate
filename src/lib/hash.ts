// 本文ハッシュ照合ユーティリティ
// 承認原文 = 送信内容の保証（v0.3-1, v0.4でcanonical payloadへ拡張）
// 承認時に正規化された実行ペイロードのSHA-256をロックし、送信報告時に照合する
import { createHash } from "node:crypto";

// ─────────────────────────────────────────────────
// レガシー: 件名＋本文のみ（v0.3互換）
// ─────────────────────────────────────────────────

/** 照合対象の正規化（改行差の吸収のみ。内容は変えない） */
export function normalizeEmailBody(subject: string, body: string): string {
  const s = subject.replace(/\r\n/g, "\n").trim();
  const b = body.replace(/\r\n/g, "\n").trim();
  return `${s}\n\n${b}`;
}

/** 件名＋本文のSHA-256ハッシュ（hex） — レガシー互換用に維持 */
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

// ─────────────────────────────────────────────────
// v0.4: Canonical Payload（実行ペイロード全体の整合性）
// ─────────────────────────────────────────────────

export interface CanonicalPayload {
  leadId: string | null;
  email: string | null; // 正規化: trim + lowercase
  subject: string;
  body: string;
}

/** Canonical Payload の正規化（deterministic） */
export function normalizePayload(payload: CanonicalPayload): string {
  const leadId = (payload.leadId ?? "").trim();
  const email = (payload.email ?? "").trim().toLowerCase();
  const subject = payload.subject.replace(/\r\n/g, "\n").trim();
  const body = payload.body.replace(/\r\n/g, "\n").trim();
  // 決定的な区切りで連結（JSON.stringifyより安定）
  return `leadId:${leadId}\nemail:${email}\nsubject:${subject}\n\n${body}`;
}

/** Canonical Payload のSHA-256ハッシュ（hex） */
export function hashPayload(payload: CanonicalPayload): string {
  return createHash("sha256").update(normalizePayload(payload), "utf8").digest("hex");
}

/**
 * Canonical Payload の照合
 * - lockedHash が無い場合は null（照合対象外・旧データ）
 * - 新ハッシュ（canonical）と一致すれば true
 * - 不一致でも、旧ハッシュ（subject+bodyのみ）で一致すれば true（後方互換）
 * - どちらも不一致なら false
 */
export function verifyPayload(
  lockedHash: string | null | undefined,
  approved: CanonicalPayload,
  sent: CanonicalPayload,
): boolean | null {
  if (!lockedHash) return null;
  const canonicalHash = hashPayload(approved);
  if (canonicalHash === lockedHash) {
    // 新ハッシュ同士の比較（sentもcanonical化して比較）
    const sentHash = hashPayload(sent);
    return sentHash === lockedHash;
  }
  // 後方互換: 旧ロック（subject+bodyのみ）でもsentが一致するか試す
  const legacyHash = hashEmailBody(approved.subject, approved.body);
  if (legacyHash === lockedHash) {
    return hashEmailBody(sent.subject, sent.body) === lockedHash;
  }
  // lockedHashが未知形式なら canonical 比較を試す
  const sentHash = hashPayload(sent);
  return sentHash === lockedHash;
}

/** lockedHash から、それが canonical / legacy のどちらかを推定（テスト・診断用） */
export function isLegacyHash(
  lockedHash: string,
  approved: CanonicalPayload,
): boolean {
  return hashEmailBody(approved.subject, approved.body) === lockedHash;
}
