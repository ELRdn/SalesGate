[English](README.md) | [日本語](README.ja.md)

# SalesGate 🚦

[![Release](https://img.shields.io/github/v/release/ELRdn/SalesGate?label=release)](https://github.com/ELRdn/SalesGate/releases) [![License: MIT](https://img.shields.io/github/license/ELRdn/SalesGate)](LICENSE) [![GHCR](https://img.shields.io/badge/GHCR-ghcr.io%2Felrdn%2Fsalesgate-blue)](https://github.com/ELRdn/SalesGate/pkgs/container/salesgate)

**The human approval and execution control layer for AI sales agents.**

SalesGate は、AI営業エージェントと実際の外部アクションの間に入り、人間承認を経たものだけが実行されることを保証する営業オペレーションハブです。

```
Agent drafts → SalesGate → Human approves → Locks approved payload → Agent claims (one winner) → Executes → Audited
```

- AIエージェントがリサーチ・下書き生成を行う
- 人間が承認キューでレビュー（**承認 / 却下 / 編集**）
- **承認されたアイテムだけが送信される**（送信はエージェント側の Gmail MCP 経由）
- 宛先・件名・本文を含む canonical payload の整合性をSHA-256で保証（SG-INV-003）

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
| ✅ 本文ハッシュ照合 | 承認時に本文をSHA-256でロック。送信報告時に実際に送信した本文と照合し、不一致を監査記録 |
| ✅ リード単位の排他 | 承認待ち・送信待ちの下書きがあるリードへの二重提出をブロック（二重タッチ防止） |
| ✅ エージェント別ビュー | タスクに担当エージェント（assignee）を指定・絞り込み。複数エージェントの並列運用に対応 |
| ✅ 営業文作成スキル | `skills/` に B2B 営業メール文面作成・送信前チェックのスキルを同梱（natural-japanese / meiseki 連携） |
| ✅ プレイブック共有 | 設定パッケージのエクスポート / インポート / 適用（設定画面から） |

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
| Agent → App | `submit_draft` | 送信予定の下書きを承認キューに提出（`agentName` で提出元を指定。同じリードに承認待ちが残っている間は再提出不可＝二重タッチ防止） |
| Agent → App | `list_pending_tasks` | 自分宛のタスク一覧を取得（`assignee` で担当エージェント別に絞り込み） |
| Agent → App | `get_approved_send_items` | 承認済み送信アイテムを **claim**（冪等・二重送信防止） |
| Agent → App | `report_send_result` | 送信結果（成功/失敗・Message-ID）を報告。`sentBody`（実際に送信した本文）を渡すと承認原文との**ハッシュ照合**を実行 |
| 双方向 | `create_task` / `update_task` | タスクの作成・変更（`assignee` で担当エージェントを指定可能） |
| 双方向 | `search_leads` / `update_lead_status` | リードの検索・ステータス更新 |
| Agent → App | `request_review` | 「この見積でいい？」と送信前に事前相談 |

ツール名は DSH では `mcp__sales-gate__submit_draft` のように名前空間付きで公開されます。

## 要件

- **Node.js 26 以上**（スクリプト実行に Node.js ネイティブの型ストリッピング（TypeScript 型の実行時除去）を利用。`import` 文には `.ts` 拡張子が必要）
- **pnpm 10 以上**

> **Security Warning**: `SALESGATE_PASSWORD` のデフォルトBasic認証は **local / trusted-network / self-host basic protection** 用です。Do not expose the default SalesGate configuration directly to the public internet. 公開する場合はリバースプロキシ(TLS/rate limiting) + VPN/Tailscale 等で保護してください。詳細は [SECURITY.md](./SECURITY.md)。

## クイックスタート

### Docker — 推奨（Git / Node.js / pnpm 不要）

**Docker だけ**で起動できます。イメージは起動時に `prisma migrate deploy` を自動実行し、`DATABASE_URL=file:/data/salesgate.db` を使用します。

```bash
docker run -d \
  --name salesgate \
  -p 3000:3000 \
  -e SALESGATE_PASSWORD=change-this-password \
  -v salesgate-data:/data \
  ghcr.io/elrdn/salesgate:latest
# → http://localhost:3000
```

- `change-this-password` は明らかなプレースホルダです。`password` や `admin` は使わないでください。強力なランダム値を設定してください。
- データは名前付きボリューム `salesgate-data`（`/data/salesgate.db`）に永続化されます。
- `latest` = 最新の安定版。特定バージョンを固定するには:

  ```bash
  docker run -d --name salesgate -p 3000:3000 -e SALESGATE_PASSWORD=change-this-password -v salesgate-data:/data ghcr.io/elrdn/salesgate:v0.4.0
  ```

**Docker Compose（git clone不要）** — `docker-compose.ghcr.yml` をコピーするか以下を保存:

```yaml
services:
  salesgate:
    image: ghcr.io/elrdn/salesgate:latest
    ports:
      - "3000:3000"
    environment:
      - SALESGATE_PASSWORD=${SALESGATE_PASSWORD:-}
    volumes:
      - salesgate-data:/data
    restart: unless-stopped

volumes:
  salesgate-data:
```

```bash
SALESGATE_PASSWORD=change-this-password docker compose -f docker-compose.ghcr.yml up -d
# → http://localhost:3000
```

アップグレード（ボリュームは維持）:

```bash
docker pull ghcr.io/elrdn/salesgate:latest
docker stop salesgate && docker rm salesgate
docker run -d --name salesgate -p 3000:3000 -e SALESGATE_PASSWORD=change-this-password -v salesgate-data:/data ghcr.io/elrdn/salesgate:latest
# 通常のアップグレードで `docker compose down -v` は使わないでください — -v はDBボリュームを削除します。
```

詳細は [docs/docker.md](./docs/docker.md) を参照。

---

### ソースから — 開発者 / コントリビューター向け

**Git + Node.js 26+ + pnpm 10+** が必要です。

```bash
git clone https://github.com/ELRdn/SalesGate.git
cd SalesGate

pnpm install

# DB スキーマの適用 + シード（SQLite）
pnpm prisma:migrate
pnpm prisma:seed

# 開発サーバー起動（MCP サーバーは /mcp で同時公開）
pnpm dev
# → http://localhost:3000（3000使用中なら3001にフォールバック）
#   MCP: http://localhost:3000/mcp
```

ブラウザで http://localhost:3000 を開くと承認キュー・リード管理の UI が使えます（ポート3000が使用中の場合、3001 に自動フォールバックします。※Stream Deck の StreamDock がポート3000を使用している環境では常に3001 になります）。

#### ソースからのDockerビルド（開発者向け）

```bash
SALESGATE_PASSWORD=change-this-password docker compose build
SALESGATE_PASSWORD=change-this-password docker compose up -d
# → http://localhost:3000（docker-compose.yml の build: . を使用）
```

### スクリプト実行の注意

- スクリプト実行は `tsx` ではなく **Node.js ネイティブの型ストリッピング**（Node 26+）で行います。`import` 文のパスには `.ts` 拡張子を付けてください
- 例: `tsx prisma/seed.ts` は `node prisma/seed.ts` として実行されます（package.json の scripts は既に Node.js 実行に合わせてあります）

### 認証の使い方

SalesGate はデフォルトでは認証なしで動作します（ローカル運用向けに全開放）。外部公開する際は環境変数 `SALESGATE_PASSWORD` を設定することで、**Basic 認証**（クッキーセッション7日）が有効になります。

```bash
# .env に設定する場合
SALESGATE_PASSWORD=your-strong-password
```

- 環境変数として渡しても構いません（`SALESGATE_PASSWORD=xxx pnpm dev` / `docker run -e ...`）
- `SALESGATE_PASSWORD` を**設定していない場合**は認証なしで全機能を利用できます
- 実装詳細は `src/proxy.ts` を参照してください（未設定ならローカル運用向けに全開放）
- `.env.example` にも記載があります

### 設定画面（`/settings`）

設定画面では以下の項目を管理できます。

- **Slack Webhook URL**: 承認待ちが発生したとき（`submit_draft` 成功時）に Slack へ通知するための Webhook URL を設定します。**未設定の場合は通知が無効**になり、アプリの動作には影響しません
- **送信履歴のエクスポート**: 「エクスポート」ボタンから送信履歴を CSV でダウンロードできます。`/api/export/logs` から BOM付きUTF-8・Excel対応の CSV（最新5000件）を取得します

## Docker

詳細なタグ一覧、Compose、ボリューム、バックアップ、対応アーキテクチャは [docs/docker.md](./docs/docker.md) を参照。

ローカル検証は引き続きパスします:

```bash
docker compose build
docker compose up -d
docker compose ps   # salesgate 起動確認
# データは salesgate-data ボリューム（/data/salesgate.db）に永続化
```

## Deployment

| 方法 | 必要なもの | 推奨用途 |
|---|---|---|
| **GHCR Dockerイメージ** (`ghcr.io/elrdn/salesgate`) | Docker | 大半のユーザー — `docker run` または `docker-compose.ghcr.yml` |
| **ソースインストール** (`pnpm dev`) | Git + Node 26+ + pnpm 10+ | コントリビューター / 開発 |
| **Dockerソースビルド** (`docker compose up --build`) | Git + Docker | 開発 / カスタムイメージ |

非対応:

| 環境 | v0.4対応 | 備考 |
|---|---|---|
| **Vercel** | ❌ v0.4非サポート | SQLiteが永続化しない。将来 `Turso/libSQL` 等で対応予定 |

SQLiteのバックアップは `prisma/dev.db` を停止中にコピーするか `VACUUM INTO` を使用してください。

### その他のコマンド

| コマンド | 説明 |
|---|---|
| `pnpm scheduler` | フォローアップ生成を1回実行 |
| `pnpm scheduler:watch` | フォローアップ生成を1時間ごとに実行（常駐） |
| `pnpm prisma:generate` | Prisma Client を再生成 |
| `pnpm test` | ユニットテスト（60件）を実行 |
| `pnpm test:watch` | テストをウォッチモードで実行 |

#### スケジューラー

- フォローアップの自動化は `pnpm scheduler`（1回）または `pnpm scheduler:watch`（1時間ごと）で実行します
- 設定画面から「今すぐ実行」ボタンでも同じ処理を手動実行できます

## テスト

### ユニットテスト

```bash
pnpm test
```

- `node:test`（`--test-isolation=none` オプション付き）で**60件**のテストがパスします
- 状態遷移・二重 claim・未承認送信の拒否・本文ハッシュ照合・プレイブック検証・**Safety invariants (SG-INV-001/002/003/005)** をカバー

### MCP E2E テスト

```bash
# 手順1: 開発サーバーを起動してから
pnpm dev

# 手順2: 別ターミナルで E2E を実行
node tests/e2e-mcp.mjs http://localhost:3001
```

- 34件の E2E テストがパスします
- `initialize → tools/list → submit_draft → 承認 → claim → 二重claim防止 → 送信報告（ハッシュ照合含む）→ 監査ログ → 抑制チェック → リード排他 → assignee ビュー → request_review` の一連のフローを検証します
- ※E2E 実行前にシード済みの DB（`pnpm prisma:seed`）が必要な場合があります

## エージェントの接続

### DSH（DeepSeek Harness）

`$DSH_HOME/profiles/<profile>/cordis.patch.yml` に追記します（例: web プロファイルの場合 `$DSH_HOME/profiles/web/cordis.patch.yml`）。**新規プラグインの追加は `insert` リスト形式**を使います（`- id: xxx` 形式は既存エントリの上書き専用のため、新規追加では「entry not found」でスキップされます）：

```yaml
- insert:
    - id: mcp-sales-gate
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: sales-gate
        transport: streamable-http
        url: http://localhost:3001/mcp
```

> **ポートの注記**: `dev` サーバーの既定ポートは3000ですが、使用中の場合は3001に自動フォールバックします。上記設定は **3001 を前提**にしています。実際に起動したポートに合わせて `url` を読み替えてください。

編集内容は **HMR（ファイル監視）で自動反映**されます（再起動不要）。反映後、DSH のモデルから `mcp__sales-gate__submit_draft` などのツールが直接利用できます（既存の会話には反映されないため、**新しい会話**を開いてください）。

### 営業文作成スキル（v0.3）

SalesGate には `skills/` 配下に2つのエージェントスキル（SKILL.md 形式・Claude Code 互換）が同梱されています。

| スキル | 役割 |
|---|---|
| `sales-email-copy` | B2B 営業メール文面作成（初回接触 / フォローアップ / 返信対応 / 休眠再活性化） |
| `sales-message-review` | 送信前チェック（スパムワード・虚偽の主張・個人情報・AI臭） |

DSH で使うには、`skill-filesystem` の `customSkillDirs` に `skills/` ディレクトリを追加します（`cordis.patch.yml` の既存エントリへの設定オーバーライド。`- id:` 形式でOK）:

```yaml
- id: skill-filesystem
  config:
    customSkillDirs:
      - C:\path\to\salesgate\skills
```

- スキルは「文面作成 → 仕上げ（`natural-japanese` / `meiseki`）→ `submit_draft` で承認キューへ提出」のフローに沿って設計されています
- **v1 を本採用**（個別観察からの導入・抵抗最小化CTA・CTA単一性チェックを追加）。スキルなし/あり（v0/v1）の比較テストと検証結果は [docs/skill-comparison.md](./docs/skill-comparison.md) を参照
- 反映は HMR で自動。新しい会話のスキルカタログに `sales-email-copy` / `sales-message-review` が表示されます
- OpenClaw / Claude Code 等でもスキルディレクトリの指定方法に従えば同様に利用可能です

### OpenClaw / Claude Code / Codex

各ハーネスの MCP クライアント設定に `http://localhost:3001/mcp`（streamable-http）を追加してください。**同じ MCP サーバーに複数ハーネスを同時接続可能**です（claim 制により二重送信は発生しません）。

詳細はエージェント別ガイドを参照:

- [DSH](./docs/setup-dsh.md)
- [OpenClaw (example)](./docs/setup-openclaw.md)
- [Claude Code (example)](./docs/setup-claude-code.md)
- [MCP Compatibility](./docs/MCP_COMPATIBILITY.md)

## 設計ドキュメント

- [DESIGN.md](./DESIGN.md) — UI / UX / Visual Design System（UI再現用Single Source of Truth, v2 navy #0B1320 / sidebar 226px / lucide）
- [ARCHITECTURE.md](./ARCHITECTURE.md) — アーキテクチャ・データフロー・MCPツール一覧・状態遷移表
- [SECURITY.md](./SECURITY.md) — 脆弱性報告・デプロイ警告・認証の位置づけ
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 開発手順・PRガイド
- [docs/docker.md](./docs/docker.md) — GHCRイメージ、タグ、`docker run` / Compose、ボリューム、アップグレード、バックアップ
- [MCP Compatibility](./docs/MCP_COMPATIBILITY.md) — SDK 1.30 / streamable-http の現状とupgrade path

## ロードマップ

実装計画・マイルストーンは [roadmap.md](./roadmap.md) を参照してください。

## ライセンス

[MIT](./LICENSE)
