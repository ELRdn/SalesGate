"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions";
import { TASK_TYPE_LABEL } from "./status-badge";

// タスク種別ごとの説明テンプレート（種別選択時に自動入力）
const TEMPLATES: Record<string, string> = {
  FOLLOW_UP:
    "前回送信から未返信です。追撃メールの下書きを作成し submit_draft で承認キューに提出してください。",
  RESEARCH: "企業情報・担当者の関心事・競合状況を調査し、結果を報告してください。",
  REVIEW_REQUEST: "送信前に人間の意見を確認したい内容を記載してください。",
  MEETING_PREP:
    "商談前の準備: 企業情報・担当者の関心事・競合状況を調査し、アジェンダと提案資料の下書きを作成してください。",
  QUOTE:
    "見積ドラフトを作成し、submit_draft で承認キューに提出してください。金額・条件・有効期限を含めてください。",
  CONTRACT:
    "契約書ドラフトを作成し、submit_draft で承認キューに提出してください。期間・金額・条件を含めてください。",
  CUSTOM: "",
};

export function TaskForm({ leads }: { leads: { id: string; company: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "CUSTOM",
    title: "",
    description: "",
    leadId: "",
    assignee: "",
    dueAt: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        await createTask({
          type: form.type as never,
          title: form.title,
          description: form.description || undefined,
          leadId: form.leadId || undefined,
          assignee: form.assignee || undefined,
          dueAt: form.dueAt || undefined,
        });
        setForm({ type: "CUSTOM", title: "", description: "", leadId: "", assignee: "", dueAt: "" });
        setResult("✅ タスクを作成しました");
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-4 font-semibold">＋ タスクを作成</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={form.type}
          onChange={(e) => {
            const type = e.target.value;
            // 種別変更時に、説明が空（またはテンプレート由来）ならテンプレートを自動入力
            setForm((prev) => ({
              ...prev,
              type,
              description: !prev.description.trim() || TEMPLATES[prev.type] === prev.description.trim()
                ? TEMPLATES[type] ?? ""
                : prev.description,
            }));
          }}
          className={inputCls}
        >
          {Object.entries(TASK_TYPE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={form.leadId}
          onChange={(e) => setForm({ ...form, leadId: e.target.value })}
          className={inputCls}
        >
          <option value="">リード未指定</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.company}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="タスク名 *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`${inputCls} sm:col-span-2`}
        />
        <textarea
          placeholder="詳細・指示（エージェントへの依頼内容）"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputCls} sm:col-span-2`}
        />
        <input
          placeholder="担当エージェント名（例: research-agent / 空欄で未指定）"
          value={form.assignee}
          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
          className={`${inputCls} sm:col-span-2`}
        />
        <input
          type="datetime-local"
          value={form.dueAt}
          onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          className={`${inputCls} sm:col-span-2`}
        />
        <button
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 sm:col-span-2"
        >
          {isPending ? "作成中..." : "作成する"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {result && <p className="mt-3 text-sm text-emerald-400">{result}</p>}
    </form>
  );
}
