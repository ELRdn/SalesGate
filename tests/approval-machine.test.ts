// 承認状態遷移のユニットテスト（node:test）
// 最重要ルールの検証: 「承認なしで送信できない」「二重claimできない」
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  APPROVAL_TRANSITIONS,
  assertTransition,
  canTransition,
  isHumanDecidable,
  isSendable,
} from "../src/lib/approval-machine.ts";

describe("承認状態遷移", () => {
  it("承認待ちからは承認・編集・却下・アーカイブへ遷移できる", () => {
    assert.equal(canTransition("AWAITING_APPROVAL", "APPROVED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "EDITED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "REJECTED"), true);
    assert.equal(canTransition("AWAITING_APPROVAL", "ARCHIVED"), true);
  });

  it("承認待ちから直接送信には遷移できない（人間の承認が必須）", () => {
    assert.equal(canTransition("AWAITING_APPROVAL", "CLAIMED"), false);
    assert.equal(canTransition("AWAITING_APPROVAL", "SENT"), false);
    assert.equal(canTransition("AWAITING_APPROVAL", "FAILED"), false);
  });

  it("送信（claim）できるのは承認済みのみ", () => {
    assert.equal(isSendable("APPROVED"), true);
    assert.equal(isSendable("EDITED"), true);
    assert.equal(isSendable("AWAITING_APPROVAL"), false);
    assert.equal(isSendable("REJECTED"), false);
    assert.equal(isSendable("CLAIMED"), false);
    assert.equal(isSendable("SENT"), false);
    assert.equal(isSendable("ARCHIVED"), false);
  });

  it("claim済みからは送信成功・失敗のみ（二重claim不可）", () => {
    assert.equal(canTransition("CLAIMED", "SENT"), true);
    assert.equal(canTransition("CLAIMED", "FAILED"), true);
    assert.equal(canTransition("CLAIMED", "CLAIMED"), false);
    assert.equal(canTransition("CLAIMED", "APPROVED"), false);
  });

  it("送信失敗は再試行できる（エージェント直接 or 人間の再承認）", () => {
    assert.equal(canTransition("FAILED", "CLAIMED"), true);
    assert.equal(canTransition("FAILED", "APPROVED"), true);
    assert.equal(canTransition("FAILED", "ARCHIVED"), true);
  });

  it("最終状態（送信済み・アーカイブ・却下）からは遷移できない", () => {
    assert.equal(APPROVAL_TRANSITIONS.SENT.length, 0);
    assert.equal(APPROVAL_TRANSITIONS.ARCHIVED.length, 0);
    assert.equal(APPROVAL_TRANSITIONS.REJECTED.length, 0);
  });

  it("assertTransition は不正な遷移で例外を投げる", () => {
    assert.throws(() => assertTransition("AWAITING_APPROVAL", "SENT"));
    assert.throws(() => assertTransition("SENT", "CLAIMED"));
    assert.throws(() => assertTransition("REJECTED", "APPROVED"));
  });

  it("正しい遷移は例外を投げない", () => {
    assert.doesNotThrow(() => assertTransition("AWAITING_APPROVAL", "APPROVED"));
    assert.doesNotThrow(() => assertTransition("APPROVED", "CLAIMED"));
    assert.doesNotThrow(() => assertTransition("CLAIMED", "SENT"));
  });

  it("人間の決定ができるのは承認待ちのみ", () => {
    assert.equal(isHumanDecidable("AWAITING_APPROVAL"), true);
    assert.equal(isHumanDecidable("APPROVED"), false);
    assert.equal(isHumanDecidable("EDITED"), false);
    assert.equal(isHumanDecidable("CLAIMED"), false);
    assert.equal(isHumanDecidable("SENT"), false);
  });
});
