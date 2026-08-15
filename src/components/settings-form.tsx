"use client";

import { useState, useTransition } from "react";
import { updateSettings, runFollowUpsNow } from "@/lib/actions";

const FIELDS: { key: string; label: string; description: string }[] = [
  {
    key: "daily_send_limit",
    label: "日次送信上限",
    description: "1日に送信できるメール数の上限（デリバビリティ保護）",
  },
  {
    key: "followup_delay_days",
    label: "フォローアップ間隔",
    description: "未返信から何日後に追撃タスクを生成するか",
  },
  {
    key: "max_touches",
    label: "最大タッチ数",
    description: "この回数を超えたらリードを休眠（SLEEPING）に移行",
  },
  {
    key: "archive_after_days",
    label: "アーカイブ日数",
    description: "承認されず放置された下書きを何日後に自動アーカイブするか",
  },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        await updateSettings(values);
        setResult("✅ 設定を保存しました");
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const runNow = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await runFollowUpsNow();
        setResult(
          `✅ 実行完了: フォローアップタスク ${r.followUpTasksCreated}件生成 / アーカイブ ${r.archivedApprovalItems}件 / 休眠移行 ${r.leadsMovedToSleeping}件`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="mb-4 font-semibold">⚙️ ルール設定</h2>
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium">{f.label}</label>
              <input
                type="number"
                min={0}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-zinc-500">{f.description}</p>
            </div>
          ))}
          <button
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 font-semibold">🔁 フォローアップ生成</h2>
          <p className="mb-3 text-sm text-zinc-500">
            スケジューラー（<code className="text-zinc-400">pnpm scheduler</code>）は1時間ごとに自動実行されます。
            手動で今すぐ実行することもできます。
          </p>
          <button
            disabled={isPending}
            onClick={runNow}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {isPending ? "実行中..." : "今すぐ実行する"}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 font-semibold">🔌 MCP接続情報</h2>
          <p className="mb-2 text-sm text-zinc-500">
            エージェント（DSH / OpenClaw / Claude Code など）はこのエンドポイントに接続します:
          </p>
          <code className="block rounded-lg bg-zinc-950 p-3 text-xs text-emerald-400">
            http://localhost:3000/mcp
          </code>
          <p className="mt-2 text-xs text-zinc-500">
            DSH の場合、<code className="text-zinc-400">cordis.patch.yml</code> に
            streamable-http トランスポートで追加してください（詳細は README.md）。
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/30 lg:col-span-2">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/30 lg:col-span-2">
          {result}
        </p>
      )}
    </div>
  );
}
