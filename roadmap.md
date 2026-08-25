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
- [x] **7. DSH 接続の実機検証**
  - `cordis.patch.yml` に MCP 設定追記（`mcp-sales-gate` / streamable-http / `http://localhost:3001/mcp`）— バックアップ `.bak` あり
  - `submit_draft` → 承認 → claim → 送信結果報告 の一連のフローを MCP E2E テスト（22件）で実機検証
  - ツール名（`mcp__sales-gate__*`）の確認 — SalesGate 側ログに DSH 由来の MCP トラフィック（202 含む）を確認済み。新規会話でのツール可視性は最終確認事項
- [x] **8. テスト + Git 初期化**
  - [x] 状態遷移のユニットテスト（二重 claim・未承認送信の拒否を含む）— `pnpm test` で15件パス
  - [x] MCP E2E テスト — `node tests/e2e-mcp.mjs http://localhost:3001` で22件パス
  - [x] git init・`.gitignore`・初回コミット（`0f25772`・42ファイル）

> **進捗メモ**: **v0.1 の8ステップすべて完了**。完了条件（DSH接続＋承認ループの動作）は MCP E2E テスト22件パスで確認済み。**実機検証も完了（2026-08-16）**: DSH 新規会話でのツール可視化確認済み / サブエージェント（新規セッション）からの MCP 疎通確認済み / `submit_draft` → 人間承認（UI）→ claim → `report_send_result`（SENT）の実機一巡テスト成功。

**v0.1 完了条件**: DSH が実際に SalesGate に接続し、「エージェントが下書き提出 → 人間が承認 → エージェントが送信 → 結果が記録される」ループがローカルで回ること。

## v0.2（実装・検証済み）

- [x] **タスクテンプレート**
  - タスク種別に `MEETING_PREP`（商談準備）・`QUOTE`（見積）・`CONTRACT`（契約）を追加
  - 種別選択時に説明テンプレートが自動入力される
  - 承認フローは v0.1 の同一仕組みを再利用
- [x] **Slack 通知**
  - `submit_draft` 成功時（承認待ち発生時）に Slack Webhook へ通知
  - Webhook URL は設定画面（`/settings`）の「Slack Webhook URL」欄で設定
  - 未設定なら通知無効（アプリの動作には影響しない）
- [x] **認証（シングルユーザー向け）**
  - 環境変数 `SALESGATE_PASSWORD` を設定した場合のみ Basic 認証を有効化（クッキーセッション7日、`src/proxy.ts`）
  - 未設定ならローカル運用向けに全開放
  - `.env.example` に記載・GitHub 公開準備が完了
- [x] **送信履歴のエクスポート（CSV）**
  - `/api/export/logs` で CSV ダウンロード（BOM付きUTF-8・Excel対応・最新5000件）
  - 設定画面にエクスポートボタンを設置

> **v0.2 検証結果**: `tsc` エラーなし / ユニットテスト15件パス / MCP E2E テスト22件パス（v0.2 機能追加後も全パス）。
> **技術ノート**: SQLite + Prisma では enum 値の追加は「スキーマ変更として検出されない」（SQLite の enum は TEXT カラムにマップされるため）。ただし Prisma Client の generated enum は更新されるためマイグレーション不要。これは正常な挙動。

## v0.3（実装・検証済み）

> **優先順位**（壁打ち決定 2026-08-16）: ①本文ハッシュ照合 → ②複数エージェント並列実行 → ③営業文作成スキル → ④プレイブック共有。マルチテナントはペンディング（OSS公開前には実装・軽め検証でOK）。

- [x] **1. 本文ハッシュ照合**（承認原文 = 送信内容の保証）
  - 承認時（approve / editAndApprove）に本文の SHA-256 を保存（`lockedHash`）
  - `report_send_result` に「実際に送信した本文」（`sentBody`）を添えて報告 → アプリが照合
  - 一致 → `SENT` + `hashMatched: true` / 不一致 → `hashMatched: false` + `hashMismatchAt` を監査記録
  - UI（承認キュー）に「本文不一致を検知」警告バッジを表示
  - 注記: 送信後検証のため「検知」はできるが「防止」はできない。監査ログとしての価値
- [x] **2. 複数エージェントの並列実行**（claim 制の運用検証）
  - リード単位の排他（承認待ち・送信待ち・送信中の下書きがあるリードへの新規提出を拒否・二重タッチ防止）
  - エージェント別ビュー（`Task.assignedTo` 追加。`list_pending_tasks` / `create_task` / `update_task` に `assignee` 対応）
  - UI: タスクフォームに担当エージェント欄・タスク一覧に表示
  - 並列シナリオの E2E テスト（送信完了後は再提出可能なことも検証）
- [x] **3. 営業文作成スキル**（DSH 対応・SKILL.md 形式・`skills/` 配下に配置）
  - `sales-email-copy`: 初回接触 / フォローアップ / 返信対応 / 休眠再活性化の文面作成ガイド
  - `sales-message-review`: 送信前チェック（スパムワード・虚偽の主張・個人情報・0〜100点スコアリング）
  - エージェントがスキルに沿って本文を作成 → `submit_draft` で提出する運用に接続
  - **仕上げ工程として導入済みの `natural-japanese`（coji）・`meiseki`（bamboo-nova）を連携**（生成文の自然な日本語化・AI臭除去）
  - DSH 側は `skill-filesystem` の `customSkillDirs` に `skills/` を追加して認識（web プロファイルの `cordis.patch.yml` に適用済み）
- [x] **4. テンプレート/プレイブックの共有**（コミュニティ資産化）
  - `Playbook` モデル追加（name / description / version / content(JSON) / source）
  - エクスポート: `/api/export/playbook`（JSON ダウンロード）/ 設定画面のボタン
  - インポート: 検証（既知キーのみ・数値チェック）→ 保存 → 設定へ即時適用
  - 一覧・適用・削除（設定画面のプレイブックセクション）
- [ ] （ペンディング）**マルチテナント対応** — OSS 公開前には実装（軽め検証・自動テスト中心）。SQLite なら「1テナント = 1DBファイル」方式で移行コストを抑えられる

> **v0.3 検証結果（2026-08-16）**: `tsc` エラーなし / ユニットテスト **36件**パス（ハッシュ照合10件・プレイブック11件・既存15件）/ MCP E2E テスト **34件**パス（v0.3 機能追加後も全パス。ハッシュ照合の一致・不一致検知、リード排他、assignee ビューを含む）。

> **営業文作成スキル v1 本採用（2026-08-16）**: v0 と v1 の比較テストを実施（4パターン×2ラウンド・ブラインド評価）。`skills/` を v1 に更新。詳細は `docs/skill-comparison.md` を参照。

## v0.4（OSS公開準備 + v2 UI）

- [x] **DESIGN.md リニューアル**（ARCHITECTURE.md 分離 + UI Design System 作成。16セクション、designmd lint 合格）
- [x] **ApprovalCard UI 改善**（border-t セパレーター、`<article>`/`<section>` セマンティクス、`focus-visible`、`<label>` ラッピング、`font-mono` ID 表示、`min-h-9` タッチターゲット）
- [x] **v2 UI Phase 1: インフラ移植**（lucide-react、neavy色系 CSS、サイドバー + トップバー + Shell）
- [x] **v2 UI Phase 2: ダッシュボード再実装**（KPI 4カード、承認キュー dense rows、タスクサマリー、送信推移チャート、リスクアラート、アクティビティ）
- [x] **v2 UI Phase 3: 承認キュー マスターディテール**（キューリスト + 詳細パネル、編集/却下モーダル、フィルタ/検索）
- [x] **v2 UI Phase 4: 全ページ移行**（リード、タスク、設定、送信履歴、抑制リスト、プレイブック）
- [x] v2 UI Phase 5: テスト更新（safety.test.ts 24件追加・全60件pass）+ DESIGN.md v2統合（neavy #0B1320 / sidebar 226px / lucide）
- [x] Repository Hygiene（tsconfig exclude + .gitignore 隔離、tsc 0 errors）
- [x] Execution Safety Hardening（SG-INV-003 canonical payload / SG-INV-004 suppression再確認 / SG-INV-005 atomic claim）
- [x] MCP Compatibility Audit（SDK 1.30 / streamable-http 現行維持、docs/MCP_COMPATIBILITY.md）
- [x] ライセンス選定（MIT — LICENSE追加、依存はMIT互換を確認）
- [x] GitHub 公開準備（README 最終化・SECURITY.md・CONTRIBUTING.md・リポジトリ構成整備）
- [x] デプロイガイド（Local✅ / Docker✅ / Vercel❌を README と docs に明記、persistent /data volume）
- [x] エージェント別セットアップガイド（docs/setup-dsh.md / setup-openclaw.md(example) / setup-claude-code.md(example)）
- [ ] マルチテナント対応（v0.5へ送付 — 1インスタンス=1DB のInstance Isolationとして文書化済み）
- [ ] v0.5 candidate: MCP SDK v2 / MCP 2026-07-28 compatibility migration（別途計画、v0.4ではv1 generationを維持）

> **v2 UI 統合完了（2026-08-25）**: prototype（`salesgate-newui-v2/`）はarchived（gitignore）。DESIGN.md がSingle Source of Truth。v0.4 RCハードニング完了。

> **v0.4 RC Hardening メモ（2026-08-25）**: SG-INV-003 canonical hash（leadId+email+subject+body）、SG-INV-004 claim時suppression再確認、SG-INV-005 atomic transaction、MCPはv1 generation(1.30.x)を維持・tested protocol behavior 2025-06-18、60 tests / tsc 0 errors、Docker永続化対応。残りはGitHub public化のみ。

## 未検証リスク（実装前に確認が必要な事項）

| リスク | 状況 | 対処 |
|---|---|---|
| DSH → streamable-http MCP の実接続 | **解決済み（2026-08-16）**。`cordis.patch.yml` は `insert` 形式で追加（`- id:` 形式は新規エントリでは「entry not found」でスキップされる仕様）。新規会話でのツール可視化・サブエージェントからの疎通・承認ループの実機一巡すべて確認済み | 完了 |
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
