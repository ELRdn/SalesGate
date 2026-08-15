# SalesGate ロードマップ

## ビジョン

最終形は**ハーネス非依存の営業オペレーションハブ**です。誰でも自分の好きな AI エージェント（DSH / OpenClaw / Claude Code / Codex など）を MCP で繋ぎ、**承認ゲート付きの営業チーム**を運用できる OSS を目指します。

## 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロント/API | Next.js 16.3（App Router）・TypeScript 5.9・Tailwind CSS v4 | UI と MCP サーバーを同一プロセスで |
| DB | SQLite + Prisma 6（driver adapter 方式） | `@prisma/adapter-better-sqlite3` + `better-sqlite3`（13.0.3 を `pnpm.overrides` で統一）。ネイティブバイナリの spawn 不要でサンドボックス・サーバーレスでも動作。**Prisma 6 にピン（7には上げない: 構成が大きく変わるため）** |
| MCP サーバー | `@modelcontextprotocol/sdk` 1.30（WebStandardStreamableHTTPServerTransport） | `/mcp` エンドポイントで公開 |
| スクリプト実行 | Node.js ネイティブの型ストリッピング（Node 26+ 必須） | `tsx` は不使用。`import` 文に `.ts` 拡張子が必須 |
| エージェント | DSH（最初）→ OpenClaw 等 | MCP クライアントを持つ任意のハーネス |

## 設計原則（変更しない）

1. **承認ファースト**: 外部送信は必ず人間の承認を経る。例外は作らない
2. **アプリは送信しない**: 送信はエージェント側の Gmail MCP が実行（アプリに送信 API を持たせない）
3. **冪等 claim 制**: 承認済みアイテムは1エージェントのみが claim。二重送信を構造的に防止
4. **ルールはアプリ側**: フォローアップのタイミング・回数はアプリで構造化管理（エージェント任せにしない）

## MVP v0.1（実装中チェックリスト）

- [x] **1. プロジェクトスキャフォールド**
  - Next.js（App Router・TypeScript）初期化
  - Prisma + SQLite セットアップ
  - pnpm workspace 構成（`app` / `mcp` の分離を意識）
- [x] **2. DB スキーマ**
  - `Lead`（企業・担当者・ステータス・抑制フラグ）
  - `Task`（種別・リード紐付け・期限・状態）
  - `ApprovalItem`（下書き本文・状態・根拠メモ・リスクフラグ・claim 情報）
  - `MessageLog`（送信結果・Message-ID・タイムスタンプ）
  - `Settings`（日次送信上限・フォローアップルール）
- [x] **3. MCP サーバー実装**
  - streamable-http で `/mcp` 公開
  - ツール実装: `submit_draft` / `list_pending_tasks` / `get_approved_send_items`(claim) / `report_send_result` / `create_task` / `update_task` / `search_leads` / `update_lead_status` / `request_review`
- [x] **4. 承認キュー API + 状態遷移**
  - 状態機械: `AWAITING_APPROVAL → APPROVED / EDITED / REJECTED / ARCHIVED`、`APPROVED / EDITED → CLAIMED`（claim制・冪等）、`CLAIMED → SENT / FAILED`、`FAILED → CLAIMED / APPROVED`
  - 7日放置で自動アーカイブ
  - 監査ログ（誰が・いつ・何を決定したか）
  - 冪等性: 承認コールバック＋claim の2層ガード
- [x] **5. UI（5画面）**
  - ダッシュボード（承認待ち数・今日の送信数・タスク状況）
  - 承認キュー（**根拠パネル**・リスクフラグ・承認/却下/編集）
  - リード一覧（ミニCRM・CSV投入・重複チェック）
  - タスク一覧
  - 設定（日次上限・フォローアップルール・抑制リスト管理・「今すぐ実行」ボタン）
- [x] **6. フォローアップスケジューラー**
  - ルール: 未返信3日で追撃タスク生成、最大3回で「休眠」に
  - 定期実行（`pnpm scheduler`（1回）/ `pnpm scheduler:watch`（1時間ごと・簡易スケジューラーで開始））
- [ ] **7. DSH 接続の実機検証**
  - `cordis.patch.yml` に MCP 設定追記
  - `submit_draft` → 承認 → claim → 送信結果報告 の一連のフローを実機テスト
  - ツール名（`mcp__sales-gate__*`）の確認
- [ ] **8. テスト + Git 初期化**
  - [x] 状態遷移のユニットテスト（二重 claim・未承認送信の拒否を含む）— `pnpm test` で15件パス
  - [x] MCP E2E テスト — `node tests/e2e-mcp.mjs http://localhost:3001` で22件パス
  - [ ] git init・`.gitignore`・初回コミット（**実施前**）

> **進捗メモ**: 機能実装・テストまで完了。**残るは 7 の「DSH 接続の実機検証」と、8 の Git 初期化・初回コミットのみ**です。

**v0.1 完了条件**: DSH が実際に SalesGate に接続し、「エージェントが下書き提出 → 人間が承認 → エージェントが送信 → 結果が記録される」ループがローカルで回ること。

## v0.2（次のマイルストーン）

- [ ] 商談準備・見積・契約のタスクテンプレート（承認フローは同一仕組みを再利用）
- [ ] Slack / Discord / メール通知（「承認待ちが来たよ」）
- [ ] 認証（シングルユーザー向けパスワード or Basic Auth）— GitHub 公開に備える
- [ ] 送信履歴のエクスポート（CSV）

## v0.3（将来構想）

- [ ] 複数エージェントの並列実行（claim 制の運用検証）
- [ ] 本文ハッシュ照合（承認された原文と送信内容の一致検証）
- [ ] マルチテナント対応
- [ ] テンプレート/プレイブックの共有（コミュニティ資産化）

## 未検証リスク（実装前に確認が必要な事項）

| リスク | 状況 | 対処 |
|---|---|---|
| DSH → streamable-http MCP の実接続 | `cordis.patch.yml` への設定追記は**完了済み**（`http://localhost:3001/mcp`、streamable-http）。ただし**実機検証はこれから**（ツール名 `mcp__sales-gate__*` の確認含む） | v0.1 ステップ7で実機検証 |
| MCP SDK の streamable-http サーバー実装 | バージョンごとに API 差の可能性 | 実装時に公式ドキュメントで確認 |
| エージェント側の Gmail MCP 設定 | 各ハーネス依存（DSH は `cordis.patch.yml`、OpenClaw は独自設定） | README に設定例を整備 |
| デリバビリティ | 大量送信でドメイン評価低下のリスク | 日次送信上限＋段階的な運用開始 |

## 競合リサーチ出典

- [Human-in-Loop Email Approval for AI Agents（mailertogo）](https://resources.mailertogo.com/how-to/implement-human-in-the-loop-email-approval-ai-agents) — 承認ゲート実装の定石（冪等性2層・承認＋編集・タイムアウト方針）
- [AI SDR Workflow: The Review Queue You Need Before Auto-Send（RecordContext）](https://www.recordcontext.com/blog/2026-05-01-ai-sdr-workflow-review-queue) — レビュー画面に根拠・文脈・リスクフラグが必要な理由
- [11x vs Artisan: AI SDR Comparison（RevOps Report）](https://therevopsreport.com/tools/11x-vs-artisan/) — 有料 AI SDR の状況・弱点（CRM統合・データ汚染リスク）
- OSS 競合: [b2b-sdr-agent-template](https://github.com/iPythoning/b2b-sdr-agent-template)（OpenClaw製・自律型）/ [harvey](https://github.com/ethanplusai/harvey)（Claude Code製・自律型）/ [ai-sdr-agent](https://github.com/kandksolvefast/ai-sdr-agent)（HITL だが返信対応のみ）/ [revenue-os](https://github.com/personizeai/revenue-os)

## 開発メモ

- 開発は Vibe Coding スタイル（要件はこのドキュメント＋壁打ちの決定事項を正とする）
- ドキュメント・コミットメッセージは日本語（技術用語は英語併記）
