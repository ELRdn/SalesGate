# MCP Compatibility Report — SalesGate v0.4

> **結論: SalesGate v0.4 intentionally remains on the @modelcontextprotocol/sdk v1 generation (1.30.x) + Streamable HTTP. The currently tested SalesGate MCP behavior uses the existing Streamable HTTP implementation.**

## Current Implementation

| 項目 | 値 |
|---|---|
| SDK | `@modelcontextprotocol/sdk` **1.30.0** (`^1.30.0`) — v1 generation |
| Transport | `WebStandardStreamableHTTPServerTransport` (`/mcp`) |
| Route | `src/app/mcp/route.ts` — `GET/POST/DELETE → handleMcpRequest` |
| Server | `McpServer(name: "sales-gate", version: "0.1.0")` + 9 tools |
| Tested protocol behavior | `2025-06-18` (E2Eで検証) |
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

- **v0.4**: 現行 **1.30.0 (v1 generation) + streamable-http を維持**。Release直前の安定性優先、既存34 E2E実績の維持、Safety-critical制御層のため。API変更小・テスト全パス・DSH接続維持・後方互換確保。
- **v0.5 candidate**: **MCP SDK v2 / MCP 2026-07-28 compatibility migration** を別途計画。`pnpm up @modelcontextprotocol/sdk` で追従を検討。`transport` は `WebStandardStreamableHTTPServerTransport` を継続（Next.js App Routerの推奨）。breaking change があれば本ドキュメントを更新しE2Eを再検証。

> Note: MCP SDK v2 / 2026-07-28 への移行は v0.4 release hardening中には導入せず、v0.5の互換性アップグレードとして計画する。

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
