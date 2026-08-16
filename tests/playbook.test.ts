// プレイブック共有のユニットテスト（node:test）
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  KNOWN_SETTING_KEYS,
  NUMERIC_SETTING_KEYS,
  STRING_SETTING_KEYS,
  buildPlaybookContent,
  validatePlaybook,
} from "../src/lib/playbook.ts";

describe("validatePlaybook", () => {
  it("正常系: 全既知キーを含むプレイブックを受理する", () => {
    const json = JSON.stringify({
      name: "SalesGate 標準設定",
      description: "テスト用",
      version: "1.2.0",
      settings: {
        daily_send_limit: "30",
        followup_delay_days: "2",
        max_touches: "5",
        archive_after_days: "14",
        slack_webhook_url: "https://hooks.slack.com/services/xxx",
      },
    });
    const result = validatePlaybook(json);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.content.name, "SalesGate 標準設定");
    assert.equal(result.content.description, "テスト用");
    assert.equal(result.content.version, "1.2.0");
    assert.equal(result.content.settings.daily_send_limit, "30");
    assert.equal(result.content.settings.slack_webhook_url, "https://hooks.slack.com/services/xxx");
  });

  it("正常系: 一部キーのみでも受理される（不足キーは許容）", () => {
    const json = JSON.stringify({
      name: "最小構成",
      settings: { daily_send_limit: "10" },
    });
    const result = validatePlaybook(json);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.content.settings.daily_send_limit, "10");
    assert.equal("max_touches" in result.content.settings, false);
  });

  it("正常系: 数値キーが数値へ変換可能なら文字列形式で受理される", () => {
    const result = validatePlaybook(
      JSON.stringify({ name: "数値テスト", settings: { max_touches: "7" } }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.content.settings.max_touches, "7");
  });

  it("異常系: JSONとしてパースできない場合はエラー", () => {
    const result = validatePlaybook("{ not valid json ");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /パース/);
  });

  it("異常系: nameが欠落している場合はエラー", () => {
    const result = validatePlaybook(JSON.stringify({ settings: {} }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /name/);
  });

  it("異常系: settingsがオブジェクトでない場合はエラー", () => {
    const result = validatePlaybook(JSON.stringify({ name: "x", settings: "not-object" }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /settings/);
  });

  it("異常系: 未知の設定キーはエラー", () => {
    const result = validatePlaybook(
      JSON.stringify({ name: "x", settings: { unknown_key: "value" } }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /未知の設定キー/);
  });

  it("異常系: 数値キーが数値でない場合はエラー", () => {
    const result = validatePlaybook(
      JSON.stringify({ name: "x", settings: { daily_send_limit: "abc" } }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /daily_send_limit/);
  });

  it("異常系: 数値キーが負の数値はエラー", () => {
    const result = validatePlaybook(
      JSON.stringify({ name: "x", settings: { max_touches: "-1" } }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /max_touches/);
  });
});

describe("buildPlaybookContent", () => {
  it("既知キーのみを抽出し、未知キー・空値は除外する", () => {
    const content = buildPlaybookContent({
      daily_send_limit: "25",
      slack_webhook_url: "https://hook.example",
      unknown_key: "should-drop",
      empty_key: "",
      followup_delay_days: "",
    });
    assert.equal(content.name, "SalesGate 設定プレイブック");
    assert.equal(content.settings.daily_send_limit, "25");
    assert.equal(content.settings.slack_webhook_url, "https://hook.example");
    assert.equal("unknown_key" in content.settings, false);
    assert.equal("followup_delay_days" in content.settings, false);
  });

  it("出力結果が validatePlaybook を必ず通る", () => {
    const content = buildPlaybookContent({
      daily_send_limit: "30",
      followup_delay_days: "2",
    });
    const reValidated = validatePlaybook(JSON.stringify(content));
    assert.equal(reValidated.ok, true);
  });
});
