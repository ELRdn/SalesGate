# DSH Setup — SalesGate MCP

DSH (DeepSeek Harness) から SalesGate に接続する方法。

## 前提

- SalesGate が `pnpm dev` で起動していること（例: `http://localhost:3001/mcp`）
- 実ポートは起動ログを確認（3000が使用中なら3001にフォールバック）

## 設定

`$DSH_HOME/profiles/<profile>/cordis.patch.yml` に追記（例: `web` プロファイル）。

**新規MCP追加は `insert` 形式**（`- id:` 形式は既存上書き専用で、新規はスキップされる）:

```yaml
- insert:
    - id: mcp-sales-gate
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: sales-gate
        transport: streamable-http
        url: http://localhost:3001/mcp
```

編集は HMR で自動反映（再起動不要）。**新しい会話**を開くと `mcp__sales-gate__submit_draft` 等が使えます。

## スキル（営業文作成）

`skills/sales-email-copy`, `skills/sales-message-review` を DSH で使う場合、`skill-filesystem` の `customSkillDirs` に追加:

```yaml
- id: skill-filesystem
  config:
    customSkillDirs:
      - D:\VibeCoding\DSH\salesgate\skills
```

※ パスは環境に合わせて変更。HMRで自動反映。

## 動作確認

DSHの新しい会話で:

```
SalesGate の承認待ちを list_pending_tasks で確認して
```

→ MCP経由でタスク一覧が返れば成功。

## トラブルシュート

- `entry not found` → `insert` 形式を使っているか確認
- ツールが表示されない → 新しい会話を開いたか確認
- `ECONNREFUSED` → SalesGate のポートと `url` が一致しているか確認
