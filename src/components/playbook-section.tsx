"use client";

import { useState, useTransition } from "react";
import { importPlaybook, applyPlaybook, deletePlaybook } from "@/lib/actions";

export interface PlaybookItem {
  id: string;
  name: string;
  description: string | null;
  version: string;
  source: string | null;
  createdAt: string;
}

export function PlaybookSection({ playbooks }: { playbooks: PlaybookItem[] }) {
  const [jsonText, setJsonText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>, successMsg: string) => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        await fn();
        setResult(successMsg);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const onImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      setError("インポートするJSONを貼り付けてください");
      return;
    }
    run(async () => {
      const r = await importPlaybook(jsonText);
      return `✅ プレイブック「${r.name}」をインポートして適用しました`;
    }, "✅ プレイブックをインポートして適用しました");
  };

  const applySaved = (id: string, name: string) => {
    run(() => applyPlaybook(id), `✅ プレイブック「${name}」を適用しました`);
  };

  const remove = (id: string, name: string) => {
    run(() => deletePlaybook(id), `🗑️ プレイブック「${name}」を削除しました`);
  };

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* エクスポート */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 font-semibold">📦 プレイブックのエクスポート</h2>
          <p className="mb-3 text-sm text-zinc-500">
            現在のルール設定（送信上限・フォローアップ間隔・タッチ数・アーカイブ日数・Webhook URL）を
            JSONプレイブックとしてダウンロードします。
          </p>
          <a
            href="/api/export/playbook"
            className="block w-full rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium hover:bg-emerald-500"
          >
            ⬇️ 現在の設定をダウンロード
          </a>
        </div>

        {/* インポート */}
        <form onSubmit={onImport} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 font-semibold">📥 プレイブックのインポート</h2>
          <p className="mb-3 text-sm text-zinc-500">
            別環境から出力したJSONを貼り付けて「インポートして適用」を押すと、
            ルール設定が反映され、プレイブックとして保存されます。
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={5}
            placeholder='{"name": "SalesGate 設定", "settings": {"daily_send_limit": "30"}}'
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs focus:border-emerald-500 focus:outline-none"
          />
          <button
            disabled={isPending}
            className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "処理中..." : "インポートして適用"}
          </button>
        </form>
      </div>

      {/* 保存済みプレイブック一覧 */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">📚 保存済みプレイブック</h2>
          <span className="text-xs text-zinc-500">インポートしたプレイブックの一覧</span>
        </div>
        {playbooks.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">保存済みのプレイブックはありません</p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {playbooks.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    v{p.version}
                    {p.description ? ` · ${p.description}` : ""}
                    {p.source ? ` · 出典: ${p.source}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => applySaved(p.id, p.name)}
                    className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
                  >
                    適用
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => remove(p.id, p.name)}
                    className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-red-500/80 disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/30">
          {error}
        </p>
      )}
      {result && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/30">
          {result}
        </p>
      )}
    </div>
  );
}
