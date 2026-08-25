# Claude Code Setup — SalesGate MCP (Example / Unverified)

> **Note:** この手順は SalesGate の MCP 実装に基づく推定例です。Claude Code側の最新MCP設定は公式ドキュメントを確認してください。

## 概要

SalesGate は `streamable-http` で `/mcp` を公開します。

Claude Code の MCP 設定（例: `.mcp.json` または `claude` 設定）に以下を追加:

```json
{
  "mcpServers": {
    "sales-gate": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

※ `type` / `transport` のキーは環境により `http` / `streamableHttp` / `streamable-http` のいずれかです。Claude CodeのMCPドキュメントを参照してください。

## スキル

`skills/` 配下の `sales-email-copy` / `sales-message-review` は、Claude Code のスキルディレクトリにパスを通すことで利用可能です。

## 検証

`submit_draft` → 承認 → `get_approved_send_items` → `report_send_result` のE2Eが通れば成功。
