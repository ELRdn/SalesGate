"use client";

import { useState, useTransition } from "react";
import { addLead, importLeadsCsv } from "@/lib/actions";

export function LeadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    notes: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        await addLead(form);
        setForm({ company: "", contactName: "", email: "", notes: "" });
        setResult("✅ リードを追加しました");
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const doImport = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await importLeadsCsv(csv);
        setResult(`✅ インポート完了: ${r.added}件追加 / ${r.skipped}件スキップ（重複・不正）`);
        setCsv("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 単体追加 */}
      <form onSubmit={submit} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="mb-4 font-semibold">＋ リードを追加</h2>
        <div className="space-y-3">
          <input
            required
            placeholder="会社名 *"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="担当者名"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className={inputCls}
          />
          <input
            required
            type="email"
            placeholder="メールアドレス *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
          <textarea
            placeholder="メモ（任意）"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputCls}
          />
          <button
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "追加中..." : "追加する"}
          </button>
        </div>
      </form>

      {/* CSV一括投入 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="mb-1 font-semibold">📄 CSV一括投入</h2>
        <p className="mb-3 text-xs text-zinc-500">
          形式: <code className="text-zinc-400">会社名,担当者名,メールアドレス</code>（1行目はヘッダー可）
        </p>
        <textarea
          rows={8}
          placeholder={"株式会社サンプル,山田太郎,taro@example.com\n株式会社テスト,佐藤花子,hanako@example.com"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
        />
        <button
          disabled={isPending || !csv.trim()}
          onClick={doImport}
          className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {isPending ? "インポート中..." : "インポートする"}
        </button>
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
