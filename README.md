# SalesGate 🚦

**Approval-first AI SDR Hub** — 何も勝手に送らない。営業はAIに、判断はあなたに。

SalesGate は、AIエージェント（ハーネス）に営業活動を任せ、**外部への送信はすべて人間が承認してから**実行する、営業オペレーションハブです。

- AIエージェントがリサーチ・下書き生成を行う
- 人間が承認キューでレビュー（**承認 / 却下 / 編集**）
- **承認されたアイテムだけが送信される**（送信はエージェント側の Gmail MCP 経由）

## なぜ「承認ファースト」か

市場の AI SDR（11x、Artisan など）は**自律送信が主流**です。効率は高い一方で「誰も見ていないメールが勝手に送られていく」不安と隣り合わせでもあります。

SalesGate はその逆張りです。**承認ゲートがあるからこそ、AI の生産性を安全に使える** — これが本プロジェクトのポジショニングです。

| | 11x / Artisan | 既存OSS（OpenClaw/Claude Code製） | **SalesGate** |
|---|---|---|---|
| 送信モデル | 自律型 | 自律型 | **承認ファースト** |
| ハーネス依存 | なし（専用SaaS） | 単一ハーネス依存 | **MCPでハーネス非依存** |
| 料金 | $2K〜5K/月 | 無料 | 無料（OSS） |
| コンプラ基盤 | ベンダー任せ | なし | 抑制リスト・監査ログ内蔵 |

## 主な機能

| 機能 | 説明 |
|---|---|
| ✅ 承認キュー | すべての送信予定を人間がレビュー。30秒で判断できるUI設計 |
| ✅ 承認 / 却下 / 編集 | 3アクション。「承認＋編集」対応（却下→作り直しのUX死を回避） |
| ✅ 根拠パネル | 「なぜこのリードか」の調査メモ・過去タッチ・ソースをレビュー画面に表示 |
| ✅ リスクフラグ | 重複・抑制リスト・過去のやり取りなどを自動検出して警告表示 |
| ✅ 抑制リスト | オプトアウト管理。コンプライアンス（GDPR）対応の基盤 |
| ✅ 日次送信上限 | デリバビリティ保護のためのボリュームガバナンス |
| ✅ 監査ログ | 承認・却下・編集の決定履歴を全記録（誰が・いつ・何を） |
| ✅ ミニCRM | リード・企業・送信履歴を自前管理（SQLite、CSV投入対応・重複チェック付き） |
| ✅ フォローアップ自動化 | 未返信3日で追撃タスクを自動生成（最大3回）。ルールはアプリ側で構造化管理 |
| ✅ MCPネイティブ | MCP クライアントを持つ任意のハーネスと接続可能 |
| ✅ Slack通知 | 承認待ちの発生時に Slack Webhook へ通知（設定画面で URL 設定） |
| ✅ CSVエクスポート | 送信履歴を `/api/export/logs` から CSV ダウンロード（BOM付きUTF-8・Excel対応・最新5000件） |
| ✅ 認証 | `SALESGATE_PASSWORD` 設定時のみ Basic 認証を有効化（未設定ならローカル運用向けに全開放） |
| ✅ タスクテンプレート | 商談準備（MEETING_PREP）・見積（QUOTE）・契約（CONTRACT）の種別説明が自動入力 |

## アーキテクチャ

```
┌──────────────────────────────┐
│     Agent Harness (任意)      │
│  DSH / OpenClaw / Claude Code│
│  Codex / Pi / Hermes ...     │
│  ※送信は各ハーネスのGmail MCP │
└──────────────┬───────────────┘
               │ MCP (streamable-http)
               ▼
┌────────────── SalesGate ─────────────────┐
│ Next.js 16.3 + TS + SQLite (Prisma 6 /  │
│  driver adapter 方式)                     │
│                                           │
│  ├─ ミニCRM（リード・企業・履歴）           │
│  ├─ 承認キュー（状態遷移＋冪等 claim 制）   │
│  ├─ ルールベーススケジューラー              │
│  ├─ 抑制リスト / 日次送信上限 / 監査ログ    │
│  └─ MCP サーバー（/mcp を公開）            │
└───────────────────────────────────────────┘
```

### 設計上の制約（重要）

- **アプリは送信 API を持たない**。送信は承認後のアイテムをエージェントが claim し、各ハーネスの Gmail MCP で実行する
- **送信できるのは「承認済みアイテムのID」を指定した場合のみ**。エージェントが勝手に別内容を送る経路は存在しない（冪等 claim 制）
- フォローアップのタイミングルールはアプリ側で構造化管理（エージェント任せにしない）

## 承認キューの状態遷移

```
下書き提出(submit_draft)
   ↓
[承認待ち AWAITING_APPROVAL] ── 👤 承認 ──→ [送信待ち APPROVED]
   │                              👤 編集 ──→ [送信待ち EDITED]
   ├─ 👤 却下 ──→ REJECTED（エージェントにフィードバック通知 ──→ 再下書き）
   └─ 7日放置 ──→ ARCHIVED（送信されない）

[送信待ち APPROVED / EDITED] ── agentが claim（冪等・二重送信防止）──→ [送信済み SENT]
送信失敗 ──→ FAILED（エージェントに返す。再 claim で CLAIMED に戻る/APPROVED に戻る）
```

## MCP ツール一覧（SalesGate が公開）

| 方向 | ツール | 説明 |
|---|---|---|
| Agent → App | `submit_draft` | 送信予定の下書きを承認キューに提出（`agentName` パラメータで提出元エージェントを指定） |
| Agent → App | `list_pending_tasks` | 自分宛のタスク一覧を取得 |
| Agent → App | `get_approved_send_items` | 承認済み送信アイテムを **claim**（冪等・二重送信防止） |
| Agent → App | `report_send_result` | 送信結果（成功/失敗・Message-ID）を報告 |
| 双方向 | `create_task` / `update_task` | タスクの作成・変更（エージェントからも可能） |
| 双方向 | `search_leads` / `update_lead_status` | リードの検索・ステータス更新 |
| Agent → App | `request_review` | 「この見積でいい？」と送信前に事前相談 |

ツール名は DSH では `mcp__sales-gate__submit_draft` のように名前空間付きで公開されます。

## 要件

- **Node.js 26 以上**（スクリプト実行に Node.js ネイティブの型ストリッピング（TypeScript 型の実行時除去）を利用。`import` 文には `.ts` 拡張子が必要）
- **pnpm 10 以上**

## クイックスタート

```bash
# 1. 依存関係のインストール
pnpm install

# 2. DB スキーマの適用 + シード（SQLite）
pnpm prisma:migrate
pnpm prisma:seed

# 3. 開発サーバー起動（MCP サーバーは /mcp で同時公開）
pnpm dev
```

ブラウザで http://localhost:3000 を開くと承認キュー・リード管理の UI が使えます（ポート3000が使用中の場合、3001 に自動フォールバックします。※Stream Deck の StreamDock がポート3000を使用している環境では常に3001 になります）。

### スクリプト実行の注意

- スクリプト実行は `tsx` ではなく **Node.js ネイティブの型ストリッピング**（Node 26+）で行います。`import` 文のパスには `.ts` 拡張子を付けてください
- 例: `tsx prisma/seed.ts` は `node prisma/seed.ts` として実行されます（package.json の scripts は既に Node.js 実行に合わせてあります）

### 認証の使い方

SalesGate はデフォルトでは認証なしで動作します（ローカル運用向けに全開放）。外部公開する際は環境変数 `SALESGATE_PASSWORD` を設定することで、**Basic 認証**（クッキーセッション7日）が有効になります。

```bash
# .env に設定する場合
SALESGATE_PASSWORD=your-strong-password
```

- 環境変数として渡しても構いません（`SALESGATE_PASSWORD=xxx pnpm dev` など）
- `SALESGATE_PASSWORD` を**設定していない場合**は認証なしで全機能を利用できます
- 実装詳細は `src/proxy.ts` を参照してください（未設定ならローカル運用向けに全開放）
- `.env.example` にも記載があります
- なお、Webhook URL などの設定類は `SALESGATE_PASSWORD` とは別に、設定画面（`/settings`）で管理する項目になります

### その他のコマンド

| コマンド | 説明 |
|---|---|
| `pnpm scheduler` | フォローアップ生成を1回実行 |
| `pnpm scheduler:watch` | フォローアップ生成を1時間ごとに実行（常駐） |
| `pnpm prisma:generate` | Prisma Client を再生成 |
| `pnpm test` | ユニットテスト（15件）を実行 |
| `pnpm test:watch` | テストをウォッチモードで実行 |

#### スケジューラー

- フォローアップの自動化は `pnpm scheduler`（1回）または `pnpm scheduler:watch`（1時間ごと）で実行します
- 設定画面から「今すぐ実行」ボタンでも同じ処理を手動実行できます

### 設定画面（`/settings`）

設定画面では以下の項目を管理できます。

- **Slack Webhook URL**: 承認待ちが発生したとき（`submit_draft` 成功時）に Slack へ通知するための Webhook URL を設定します。**未設定の場合は通知が無効**になり、アプリの動作には影響しません
- **送信履歴のエクスポート**: 「エクスポート」ボタンから送信履歴を CSV でダウンロードできます。`/api/export/logs` から BOM付きUTF-8・Excel対応の CSV（最新5000件）を取得します

## テスト

### ユニットテスト

```bash
pnpm test
```

- `node:test`（`--test-isolation=none` オプション付き）で15件のテストがパスします
- 状態遷移・二重 claim・未承認送信の拒否などをカバー

### MCP E2E テスト

```bash
# 手順1: 開発サーバーを起動してから
pnpm dev

# 手順2: 別ターミナルで E2E を実行
node tests/e2e-mcp.mjs http://localhost:3001
```

- 22件の E2E テストがパスします
- `initialize → tools/list → submit_draft → 承認 → claim → 二重claim防止 → 送信報告 → 監査ログ → 抑制チェック → request_review` の一連のフローを検証します
- ※E2E 実行前にシード済みの DB（`pnpm prisma:seed`）が必要な場合があります

## エージェントの接続

### DSH（DeepSeek Harness）

`$DSH_HOME/profiles/<profile>/cordis.patch.yml` に追記します（例: web プロファイルの場合 `$DSH_HOME/profiles/web/cordis.patch.yml`）：

```yaml
- id: mcp-sales-gate
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: sales-gate
    transport: streamable-http
    url: http://localhost:3001/mcp
```

> **ポートの注記**: `dev` サーバーの既定ポートは3000ですが、使用中の場合は3001に自動フォールバックします。上記設定は **3001 を前提**にしています。実際に起動したポートに合わせて `url` を読み替えてください。

再起動後、DSH のモデルから `mcp__sales-gate__submit_draft` などのツールが直接利用できます。

### OpenClaw / Claude Code / Codex

各ハーネスの MCP クライアント設定に `http://localhost:3001/mcp`（streamable-http）を追加してください。**同じ MCP サーバーに複数ハーネスを同時接続可能**です（claim 制により二重送信は発生しません）。

## ロードマップ

実装計画・マイルストーンは [roadmap.md](./roadmap.md) を参照してください。

## ライセンス

[MIT](./LICENSE)
