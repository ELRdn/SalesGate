// CSVパースのユニットテスト（node:test）
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsvLeads, splitCsvLine } from "../src/lib/csv.ts";

describe("CSVパース", () => {
  it("3列形式（会社名,担当者名,メール）をパースする", () => {
    const rows = parseCsvLeads(
      "株式会社A,山田太郎,taro@example.com\n株式会社B,佐藤花子,hanako@example.com",
    );
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      company: "株式会社A",
      contactName: "山田太郎",
      email: "taro@example.com",
    });
    assert.deepEqual(rows[1], {
      company: "株式会社B",
      contactName: "佐藤花子",
      email: "hanako@example.com",
    });
  });

  it("2列形式（会社名,メール）をパースする", () => {
    const rows = parseCsvLeads("株式会社A,taro@example.com\n株式会社B,hanako@example.com");
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], { company: "株式会社A", email: "taro@example.com" });
  });

  it("ヘッダー行（日本語・英語）をスキップする", () => {
    assert.equal(parseCsvLeads("会社名,担当者,メール\n株式会社A,山田,taro@example.com").length, 1);
    assert.equal(parseCsvLeads("company,contact,email\n株式会社A,山田,taro@example.com").length, 1);
  });

  it("引用符内のカンマに対応する", () => {
    assert.deepEqual(splitCsvLine('"株式会社, サンプル",山田,taro@example.com'), [
      "株式会社, サンプル",
      "山田",
      "taro@example.com",
    ]);
  });

  it("空行・空白行をスキップする", () => {
    const rows = parseCsvLeads("\n株式会社A,taro@example.com\n\n   \n");
    assert.equal(rows.length, 1);
  });

  it("1列しかない行は無視する", () => {
    const rows = parseCsvLeads("株式会社A\ntaro@example.com");
    assert.equal(rows.length, 0);
  });
});
