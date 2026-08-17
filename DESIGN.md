# SalesGate DESIGN.md — 技術設計ドキュメント

最終更新: 2026-08-16

---

## 1. プロジェクト概要

SalesGate は「承認ファーストの AI SDR（Sales Development Representative）ハブ」です。AI エージェントが営業メールの下書きを書き、**人間が承認するまで外部には一切送信されません**。MCP（Model Context Protocol）経由で複数のエージェントハーネス（DSH / OpenClaw / Claude Code 等）が接続し、同じ承認キューを共有します。

### 設計思想

| 原則 | 内容 |
|---|---|
| **承認ファースト** | エージェントは `submit_draft` で承認キューに提出するだけ。送信は人間の承認後にのみ |
| **エージェント不可信頼** | エージェントの出力は常に検証・承認の対象。自動送信は一切しない |
| **冪等なクレーム** | 承認済みアイテムは1エージェントのみが `claim` 可能（二重送信防止） |
| **監査可能性** | 全操作に監査ログ（submittedBy / approvedBy / sentBy）を残す |
| **外部送信ゼロ** | アプリ自体はメール送信を行わない（ハーネスの Gmail MCP 等が担当） |

---

## 2. アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    エージェントハーネス                        │
│  (DSH / OpenClaw / Claude Code / Codex)                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │  ...               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │             │             │                          │
│       └──────┬──────┴──────┬──────┘                          │
│              │  MCP Client │                                 │
└──────────────┼─────────────┼─────────────────────────────────┘
               │             │
               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                  SalesGate MCP Server                        │
│              (http://localhost:3001/mcp)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MCP ツール群                                       │    │
│  │  • submit_draft      • list_pending_tasks           │    │
│  │  • claim             • report_send_result           │    │
│  │  • search_leads      • create_task                  │    │
│  │  • update_task       • list_leads                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Server Actions (Web UI用)                          │    │
│  │  • approveApprovalItem  • editAndApprove            │    │
│  │  • rejectApprovalItem   • archiveApprovalItem       │    │
│  │  • applyPlaybook        • exportPlaybook            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Web UI                              │
│              (http://localhost:3001)                         │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │/     │ │/leads│ │/tasks│ │/sett.│                       │
│  │Dash  │ │CRM   │ │Tasks │ │Sett. │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  SQLite (Prisma)                             │
│              prisma/dev.db                                  │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌────────┐       │
│  │Lead  │ │Task  │ │Approval  │ │MsgLog│ │Setting │       │
│  │      │ │      │ │Item      │ │      │ │/Playbk │       │
│  └──────┘ └──────┘ └──────────┘ └──────┘ └────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. コンポーネント構成

### 3-1. lib/（ビジネスロジック）

| ファイル | 役割 |
|---|---|
| `prisma.ts` | Prismaクライアント（DB接続プール） |
| `mcp-server.ts` | MCPサーバー定義（ツール登録・ハンドラ） |
| `actions.ts` | Server Actions（承認・編集・プレイブック操作） |
| `approval-machine.ts` | 承認ステートマシン（状態遷移のバリデーション） |
| `hash.ts` | 本文SHA-256ハッシュ（承認時ロック・送信時照合） |
| `serialize.ts` | DB → UI用のシリアライゼーション |
| `followup.ts` | フォローアップルール（日次上限・待機期間） |
| `settings.ts` | アプリ設定の読み書き |
| `playbook.ts` | プレイブックの検証・構築・パース |
| `notify.ts` | Slack Webhook通知 |
| `csv.ts` | CSVインポート/エクスポート |

### 3-2. app/（ページ・API）

| パス | 役割 |
|---|---|
| `/` | ダッシュボード（承認待ち件数・リード統計） |
| `/leads` | リード管理（CRM一覧・ステータス変更） |
| `/tasks` | タスク管理（エージェント宛タスク一覧） |
| `/approvals` | 承認キュー（承認・編集・却下・アーカイブ） |
| `/settings` | 設定（日次上限・フォローアップルール・プレイブック） |
| `/mcp` | MCPエンドポイント（streamable-http） |
| `/api/export/logs` | 監査ログCSVエクスポート |
| `/api/export/playbook` | プレイブックJSONエクスポート |

### 3-3. components/（UIコンポーネント）

| コンポーネント | 役割 |
|---|---|
| `approval-card.tsx` | 承認アイテムカード（本文・根拠・リスクフラグ・ハッシュバッジ） |
| `lead-row.tsx` | リード一覧行（ステータスバッジ・タッチ回数） |
| `task-row.tsx` | タスク一覧行（担当エージェント表示） |
| `task-form.tsx` | タスク作成フォーム（担当エージェント入力） |
| `settings-form.tsx` | 設定フォーム |
| `playbook-section.tsx` | プレイブック管理（エクスポート/インポート/適用/削除） |
| `nav.tsx` | ナビゲーションバー |
| `status-badge.tsx` | ステータスバッジ |

---

## 4. データフロー

### 4-1. 営業メールの承認フロー

```
エージェント ──→ submit_draft ──→ 承認キュー ──→ 人間が承認
  (MCP)           (DB作成)         (Web UI)       (approve)
                                                        │
                                                        ▼
エージェント ←── report_send_result ←── Gmail MCP ←── 送信
  (監査ログ)       (送信結果報告)        (ハーネス側)
```

1. エージェントが `submit_draft` で文面を提出
2. `AWAITING_APPROVAL` としてDBに保存
3. 人間がWeb UIで確認・承認（または編集して承認）
4. `APPROVED` または `EDITED` に遷移
5. エージェントが `claim` して送信ハンドオフ
6. ハーネスの Gmail MCP 等で実送信
7. エージェントが `report_send_result` で結果報告
8. `SENT` または `FAILED` に遷移

### 4-2. 本文ハッシュ照合フロー

```
承認時: hashEmailBody(subject, body) → lockedHash をDBに保存
  │
  ▼
送信時: report_send_result(sentBody) → verifyEmailBody(lockedHash, approvedSubject, sentBody)
  │
  ├── true  → hashMatched: true（正常）
  └── false → hashMismatchAt を記録（UIに警告バッジ表示）
```

### 4-3. リード排他（二重タッチ防止）

```
submit_draft(leadId) 実行時:
  │
  ├── 既に AWAITING_APPROVAL / APPROVED / EDITED / CLAIMED のアイテムがあれば拒否
  └── なければ新規作成
```

---

## 5. 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 15（App Router） |
| 言語 | TypeScript（Node.js 26 native type-stripping） |
| ORM | Prisma（SQLite） |
| スタイリング | Tailwind CSS v4 |
| MCP | `@modelcontextprotocol/sdk`（streamable-http） |
| テスト | `node --test`（ユニット） + Playwright（E2E） |
| UIテーマ | 暗色（zinc-900）・日本語ラベル |
| デプロイ | ローカル（`pnpm dev`） |

---

## 6. MCP ツール一覧

| ツール名 | 役割 | 入力 | 重要注意 |
|---|---|---|---|
| `submit_draft` | 下書きを承認キューに提出 | subject, body, leadId?, agentName?, evidence?, riskFlags? | 二重タッチ防止・抑制リストチェック |
| `list_pending_tasks` | エージェント宛タスク一覧 | assignee? | assignedToフィルタ対応 |
| `claim` | 承認済みアイテムをクレーム | itemId | 冪等（1エージェントのみ） |
| `report_send_result` | 送信結果を報告 | itemId, status, messageId?, sentBody? | ハッシュ照合（sentBody提供時） |
| `search_leads` | リードを検索 | query?, status?, limit? | email一意制約 |
| `create_task` | タスクを作成 | type, title, description?, leadId?, assignedTo? | assignedTo対応 |
| `update_task` | タスクを更新 | taskId, status?, description?, humanComment?, assignedTo? | assignedTo対応 |
| `list_leads` | リード一覧 | status?, limit? | — |

---

## 7. データベーススキーマ

### リード（Lead）
```
id, company, contactName, email(一意), status, notes,
touchCount, lastTouchAt, nextFollowUpAt, createdAt, updatedAt
```

### タスク（Task）
```
id, type, title, description, status, humanComment,
assignedTo, leadId, dueAt, createdAt, updatedAt
```

### 承認アイテム（ApprovalItem）
```
id, leadId, subject, body, status, submittedBy,
evidence, riskFlags(JSON), feedback, editedBody,
approvedAt, rejectedAt, archivedAt,
claimedBy, claimedAt, sentAt, messageId, error,
lockedHash, hashMismatchAt, createdAt, updatedAt
```

### 送信履歴（MessageLog）
```
id, approvalItemId, leadId, subject, body,
status, messageId, error, sentBy, sentAt
```

### 設定（Setting）
```
key(主キー), value
```

### プレイブック（Playbook）
```
id, name, description, version, content(JSON), source, createdAt, updatedAt
```

---

## 8. スキル（営業文作成）

`skills/` ディレクトリに配置。DSHの `skill-filesystem` で発見。

| スキル | 役割 | 主な機能 |
|---|---|---|
| `sales-email-copy` | 営業メール文面作成 | 個別観察からの導入・抵抗最小化CTA・250字圧縮・品質チェックリスト |
| `sales-message-review` | 送信前チェック | 8項目スコアリング（CTA単一性・CTAハードル含む）・修正提案 |

v0.3 で作成。v1 改善版は `skills-v1/` に保存。詳細は `docs/skill-comparison.md` を参照。

---

## 9. 将来計画（v0.4〜）

| バージョン | 内容 |
|---|---|
| v0.4 | OSS公開準備（MITライセンス・GitHub公開・デプロイガイド） |
| v0.5 | マルチテナント対応（1テナント=1DBファイル方式） |
| v0.6 | Gmail MCP連携の自動化（承認後自動送信のオプション） |

---

## 10. 開発コマンド

```bash
pnpm dev          # 開発サーバー起動（http://localhost:3001）
pnpm exec tsc --noEmit  # 型チェック
pnpm prisma:generate    # Prismaクライアント生成
pnpm prisma:migrate     # DBマイグレーション
node --test --test-isolation=none tests/*.test.ts  # ユニットテスト
node tests/e2e-mcp.mjs http://localhost:3001        # E2Eテスト
```
