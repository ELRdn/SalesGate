# OpenClaw Setup — SalesGate MCP (Example / Unverified)

> **Note:** この手順は SalesGate の MCP 実装（`http://localhost:3001/mcp`, `streamable-http`）に基づく推定例です。OpenClaw側の最新MCP設定は公式ドキュメントを確認してください。

## 概要

SalesGate は `streamable-http` で `/mcp` を公開します。OpenClaw の MCP クライアント設定に以下を追加します。

```json
{
  "mcpServers": {
    "sales-gate": {
      "transport": "streamable-http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

※ 設定ファイルの場所・キーは OpenClaw のバージョンにより異なります。`mcpServers` / `streamable-http` / `url` の3点を確認してください。

## 複数ハーネス同時接続

SalesGate は複数ハーネスを同時に受け付けます（claim制で二重送信は防止）。

## 検証

OpenClaw から `submit_draft` → SalesGate UIで承認 → `get_approved_send_items` で claim → `report_send_result` のループが回れば成功。
