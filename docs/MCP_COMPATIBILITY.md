# MCP Compatibility Report — SalesGate v0.4

> **結論: 現行 SDK 1.30 + streamable-http は 2026年時点で推奨構成。v0.4では現行維持。**

## Current Implementation

| 項目 | 値 |
|---|---|
| SDK | `@modelcontextprotocol/sdk` **1.30.0** (`^1.30.0`) |
| Transport | `WebStandardStreamableHTTPServerTransport` (`/mcp`) |
| Route | `src/app/mcp/route.ts` — `GET/POST/DELETE → handleMcpRequest` |
| Server | `McpServer(name: "sales-gate", version: "0.1.0")` + 9 tools |
| Protocol | `2025-06-18` (E2Eで検証) |
| Session | `mcp-session-id` ヘッダ + `Map<sessionId, Transport>` (シングルプロセス・インメモリ) |

## Supported Protocol Behavior

- `initialize` → `notifications/initialized` → `tools/list` → `tools/call` のフルフロー
- `Accept: application/json, text/event-stream` / `Content-Type: application/json`
- レスポンスは JSON 直返しと SSE `data:` 行の両対応（`tests/e2e-mcp.mjs` で検証）
- 9 tools: `submit_draft` / `list_pending_tasks` / `get_approved_send_items` / `report_send_result` / `create_task` / `update_task` / `search_leads` / `update_lead_status` / `request_review`

## Known Limitations

| 制限 | 影響 | 対応 |
|---|---|---|
| `transports` がインメモリ `Map` | プロセス再起動でセッション消失、マルチインスタンス非対応 | v0.4はローカル単一プロセス運用が公式サポート。将来のスケール時は外部ストアへ |
| `approvalItem.lockedHash` の旧データは legacy hash | 旧DBのハッシュは `subject+body` のみ。`verifyPayload` が自動フォールバックで互換 | 新規承認は canonical hash でロック。旧データは次回承認で更新 |
| Vercel等のサーバーレスでは SQLite が永続化しない | `/mcp` が複数インスタンスで分離 | v0.4では Vercel は非公式サポート。`Turso/libSQL` 等を将来検討 |

## Recommended Upgrade Path

- **v0.4**: 現行 **1.30.0 + streamable-http を維持**。API変更小・テスト全パス・DSH接続維持・後方互換確保のため。
- **v0.5以降**: SDKのメジャーバンプがあれば `pnpm up @modelcontextprotocol/sdk` で追従。`transport` は `WebStandardStreamableHTTPServerTransport` を継続（Next.js App Routerの推奨）。breaking change があれば `docs/MCP_COMPATIBILITY.md` を更新し E2E を再検証。

## Verification

```bash
pnpm exec tsc --noEmit          # 0 errors
pnpm test                       # 36 pass (+ 追加のsafety tests)
node tests/e2e-mcp.mjs http://localhost:3001  # 34 pass (dev起動時)
```

## References

- `package.json:35` / `pnpm-lock.yaml:416`
- `src/app/mcp/route.ts` / `src/lib/mcp-server.ts:22`
- `tests/e2e-mcp.mjs:86-98`
- DSH: `cordis.patch.yml` `transport: streamable-http` / `url: http://localhost:3001/mcp`
