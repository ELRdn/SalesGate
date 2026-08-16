// 本文ハッシュ照合のユニットテスト（node:test）
// v0.3-1: 承認原文 = 送信内容の保証
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashEmailBody, normalizeEmailBody, verifyEmailBody } from "../src/lib/hash.ts";

describe("本文ハッシュ照合", () => {
  it("同じ件名・本文ならハッシュが一致する", () => {
    assert.equal(hashEmailBody("件名", "本文"), hashEmailBody("件名", "本文"));
  });

  it("本文が違えばハッシュが異なる", () => {
    assert.notEqual(hashEmailBody("件名", "本文A"), hashEmailBody("件名", "本文B"));
  });

  it("件名が違えばハッシュが異なる", () => {
    assert.notEqual(hashEmailBody("件名A", "本文"), hashEmailBody("件名B", "本文"));
  });

  it("改行の違い（CRLF/LF）は正規化され一致する", () => {
    assert.equal(hashEmailBody("件名", "本文\r\n2行目"), hashEmailBody("件名", "本文\n2行目"));
  });

  it("前後の空白は正規化され一致する", () => {
    assert.equal(hashEmailBody("件名", " 本文 "), hashEmailBody("件名", "本文"));
  });

  it("normalizeEmailBody は改行と空白を正規化する", () => {
    assert.equal(normalizeEmailBody("件名", "本文\r\n2行目"), "件名\n\n本文\n2行目");
  });

  it("verifyEmailBody は一致で true", () => {
    const hash = hashEmailBody("件名", "本文");
    assert.equal(verifyEmailBody(hash, "件名", "本文"), true);
  });

  it("verifyEmailBody は不一致で false", () => {
    const hash = hashEmailBody("件名", "本文");
    assert.equal(verifyEmailBody(hash, "件名", "違う本文"), false);
  });

  it("lockedHash が無い場合は null（照合対象外・旧データ）", () => {
    assert.equal(verifyEmailBody(null, "件名", "本文"), null);
    assert.equal(verifyEmailBody(undefined, "件名", "本文"), null);
  });

  it("SHA-256は64文字のhex", () => {
    assert.match(hashEmailBody("件名", "本文"), /^[0-9a-f]{64}$/);
  });
});
