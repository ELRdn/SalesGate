// Safety invariants のユニットテスト（SG-INV-001〜006）
// v0.4 RC: 承認・実行安全性の回帰防止
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canTransition, isSendable, isHumanDecidable } from "../src/lib/approval-machine.ts";
import {
  hashEmailBody,
  hashPayload,
  normalizePayload,
  verifyEmailBody,
  verifyPayload,
} from "../src/lib/hash.ts";

// ─────────────────────────────────────────────────
// SG-INV-001: No approval, no execution
// ─────────────────────────────────────────────────
describe("SG-INV-001: 未承認は claim/実行不可", () => {
  it("AWAITING_APPROVAL から CLAIMED / SENT には遷移できない", () => {
    assert.equal(canTransition("AWAITING_APPROVAL", "CLAIMED"), false);
    assert.equal(canTransition("AWAITING_APPROVAL", "SENT"), false);
  });
  it("isSendable は APPROVED/EDITED のみ true", () => {
    assert.equal(isSendable("AWAITING_APPROVAL"), false);
    assert.equal(isSendable("REJECTED"), false);
    assert.equal(isSendable("ARCHIVED"), false);
    assert.equal(isSendable("CLAIMED"), false);
    assert.equal(isSendable("SENT"), false);
    assert.equal(isSendable("FAILED"), false);
    assert.equal(isSendable("APPROVED"), true);
    assert.equal(isSendable("EDITED"), true);
  });
  it("isHumanDecidable は AWAITING_APPROVAL のみ", () => {
    assert.equal(isHumanDecidable("AWAITING_APPROVAL"), true);
    assert.equal(isHumanDecidable("APPROVED"), false);
    assert.equal(isHumanDecidable("CLAIMED"), false);
  });
});

// ─────────────────────────────────────────────────
// SG-INV-002: Approval locks specific revision
// ─────────────────────────────────────────────────
describe("SG-INV-002: 承認は特定リビジョンをロック", () => {
  it("APPROVED/EDITED から直接 APPROVED/EDITED へは遷移できない（再承認が必要）", () => {
    assert.equal(canTransition("APPROVED", "APPROVED"), false);
    assert.equal(canTransition("EDITED", "EDITED"), false);
    assert.equal(canTransition("APPROVED", "EDITED"), false);
  });
  it("REJECTED/SENT/ARCHIVED からは一切遷移できない", () => {
    assert.equal(canTransition("REJECTED", "APPROVED"), false);
    assert.equal(canTransition("SENT", "CLAIMED"), false);
    assert.equal(canTransition("ARCHIVED", "APPROVED"), false);
  });
  it("FAILED からは CLAIMED / APPROVED にのみ遷移可能（リトライ）", () => {
    assert.equal(canTransition("FAILED", "CLAIMED"), true);
    assert.equal(canTransition("FAILED", "APPROVED"), true);
    assert.equal(canTransition("FAILED", "SENT"), false);
    assert.equal(canTransition("FAILED", "REJECTED"), false);
  });
});

// ─────────────────────────────────────────────────
// SG-INV-003: Canonical payload integrity
// ─────────────────────────────────────────────────
describe("SG-INV-003: Canonical payload 整合性", () => {
  const base = { leadId: "lead_1", email: "a@example.com", subject: "件名", body: "本文" };

  it("同一 canonical payload は同一ハッシュ", () => {
    assert.equal(hashPayload(base), hashPayload({ ...base }));
  });
  it("leadId が違えばハッシュが異なる（宛先すり替え検知）", () => {
    assert.notEqual(hashPayload(base), hashPayload({ ...base, leadId: "lead_2" }));
  });
  it("email が違えばハッシュが異なる（宛先すり替え検知）", () => {
    assert.notEqual(hashPayload(base), hashPayload({ ...base, email: "b@example.com" }));
  });
  it("subject が違えばハッシュが異なる", () => {
    assert.notEqual(hashPayload(base), hashPayload({ ...base, subject: "別件名" }));
  });
  it("body が違えばハッシュが異なる", () => {
    assert.notEqual(hashPayload(base), hashPayload({ ...base, body: "別本文" }));
  });
  it("email は大文字小文字を正規化（case-insensitive）", () => {
    assert.equal(hashPayload({ ...base, email: "A@Example.COM" }), hashPayload({ ...base, email: "a@example.com" }));
  });
  it("前後空白・改行差は正規化される", () => {
    assert.equal(
      hashPayload({ ...base, subject: " 件名 ", body: " 本文\r\n2行目 " }),
      hashPayload({ ...base, subject: "件名", body: "本文\n2行目" }),
    );
  });
  it("verifyPayload: 完全一致なら true", () => {
    const h = hashPayload(base);
    assert.equal(verifyPayload(h, base, { ...base }), true);
  });
  it("verifyPayload: 宛先違いは false", () => {
    const h = hashPayload(base);
    assert.equal(verifyPayload(h, base, { ...base, email: "other@example.com" }), false);
  });
  it("verifyPayload: 旧ハッシュ（subject+bodyのみ）でも後方互換で true", () => {
    const legacyHash = hashEmailBody("件名", "本文");
    const approved = { leadId: "lead_1", email: "a@example.com", subject: "件名", body: "本文" };
    const sent = { leadId: "lead_1", email: "a@example.com", subject: "件名", body: "本文" };
    // legacyでロックされたものは sent が同 subject/body なら true
    assert.equal(verifyPayload(legacyHash, approved, sent), true);
    // body違いは false
    assert.equal(verifyPayload(legacyHash, approved, { ...sent, body: "別本文" }), false);
  });
  it("verifyPayload: lockedHash が無い場合は null", () => {
    assert.equal(verifyPayload(null, base, base), null);
    assert.equal(verifyPayload(undefined, base, base), null);
  });
  it("normalizePayload は決定的（順序・区切りが固定）", () => {
    const n = normalizePayload(base);
    assert.match(n, /^leadId:lead_1/);
    assert.match(n, /email:a@example.com/);
  });
  it("legacy verifyEmailBody は維持される", () => {
    const h = hashEmailBody("件名", "本文");
    assert.equal(verifyEmailBody(h, "件名", "本文"), true);
    assert.equal(verifyEmailBody(h, "件名", "違う本文"), false);
  });
});

// ─────────────────────────────────────────────────
// SG-INV-005: Exactly one executor (state machine level)
// ─────────────────────────────────────────────────
describe("SG-INV-005: Exactly one executor（状態機械）", () => {
  it("APPROVED → CLAIMED は1回のみ、CLAIMED → CLAIMED は不可", () => {
    assert.equal(canTransition("APPROVED", "CLAIMED"), true);
    assert.equal(canTransition("CLAIMED", "CLAIMED"), false);
  });
  it("CLAIMED → SENT / FAILED のみ", () => {
    assert.equal(canTransition("CLAIMED", "SENT"), true);
    assert.equal(canTransition("CLAIMED", "FAILED"), true);
    assert.equal(canTransition("CLAIMED", "APPROVED"), false);
  });
  it("SENT は終端（再実行不可）", () => {
    assert.equal(canTransition("SENT", "CLAIMED"), false);
    assert.equal(canTransition("SENT", "SENT"), false);
    assert.equal(canTransition("SENT", "APPROVED"), false);
  });
});

// ─────────────────────────────────────────────────
// State machine completeness
// ─────────────────────────────────────────────────
describe("State machine: 全遷移表の整合性", () => {
  it("REJECTED/ARCHIVED は終端", () => {
    for (const to of ["AWAITING_APPROVAL", "APPROVED", "EDITED", "CLAIMED", "SENT", "FAILED", "REJECTED", "ARCHIVED"] as const) {
      assert.equal(canTransition("REJECTED", to), false);
      assert.equal(canTransition("ARCHIVED", to), false);
    }
  });
  it("AWAITING_APPROVAL からは4方向のみ", () => {
    assert.equal(canTransition("AWAITING_APPROVAL", "APPROVED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "EDITED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "REJECTED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "ARCHIVED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "CLAIMED"), false);
    assert.equal(canTransition("AWAITING_APPROVAL", "SENT"), false);
  });
});
