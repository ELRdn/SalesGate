"use client";

import { useState, useTransition } from "react";
import {
  approveApprovalItem,
  rejectApprovalItem,
  editAndApproveApprovalItem,
  retryFailedApprovalItem,
} from "@/lib/actions";
import { ApprovalStatusBadge } from "./status-badge";
import { timeAgo, type SerializedApprovalItem } from "@/lib/serialize";

export function ApprovalCard({ item }: { item: SerializedApprovalItem }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view");
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.editedBody ?? item.body);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  };

  const decidable = item.status === "AWAITING_APPROVAL";
  const failed = item.status === "FAILED";

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-zinc-100">{item.subject}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {item.lead
              ? `${item.lead.company}${item.lead.contactName ? ` / ${item.lead.contactName}` : ""} <${item.lead.email}>`
              : "リード未紐付け"}
            {item.submittedBy ? ` · ${item.submittedBy}` : ""} · {timeAgo(item.createdAt)} ·{" "}
            <span className="font-mono">{item.id}</span>
          </p>
        </div>
        <ApprovalStatusBadge status={item.status} />
      </div>

      {/* 根拠パネル: なぜこのリードに送るのか */}
      {item.evidence && (
        <section className="mt-4 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
          <p className="text-xs font-semibold text-emerald-400">📋 根拠</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{item.evidence}</p>
        </section>
      )}

      {/* リスクフラグ */}
      {item.riskFlags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="リスクフラグ">
          {item.riskFlags.map((f, i) => (
            <span
              key={i}
              className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400 ring-1 ring-red-500/30"
            >
              ⚠ {f}
            </span>
          ))}
        </div>
      )}

      {/* ハッシュ照合警告（v0.3-1）: 送信本文が承認原文と不一致 */}
      {item.hashMismatchAt && (
        <section className="mt-3 rounded-lg border border-red-800/50 bg-red-950/30 p-3">
          <p className="text-xs font-semibold text-red-400">
            ⚠️ 本文不一致を検知（{timeAgo(item.hashMismatchAt)}）
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            送信された本文が承認原文と一致しませんでした。監査ログに記録されています。エージェントの送信内容を確認してください。
          </p>
        </section>
      )}

      {/* 本文 / 編集フォーム */}
      {mode === "edit" ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-400">件名</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-400">メール本文</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() => run(() => editAndApproveApprovalItem(item.id, subject, body))}
              className="min-h-9 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              編集して承認
            </button>
            <button
              onClick={() => setMode("view")}
              className="min-h-9 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              戻る
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs font-semibold text-zinc-500">件名</p>
          <p className="mt-1 font-semibold text-zinc-100">{item.subject}</p>
          <p className="mt-4 text-xs font-semibold text-zinc-500">メール本文</p>
          <div className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-300">
            {item.editedBody ?? item.body}
          </div>
        </>
      )}

      {/* 却下フォーム */}
      {mode === "reject" && (
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-zinc-400">却下理由・エージェントへのフィードバック</span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="任意で入力"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              disabled={isPending}
              onClick={() => run(() => rejectApprovalItem(item.id, feedback))}
              className="min-h-9 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50"
            >
              却下する
            </button>
            <button
              onClick={() => setMode("view")}
              className="min-h-9 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              戻る
            </button>
          </div>
        </label>
      )}

      {/* アクション */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-500">
          {item.lockedHash ? "🔒 Hash locked ✓" : "Hash unlocked"}
        </p>
        <div className="flex flex-wrap gap-2">
          {decidable && (
            <>
              <button
                disabled={isPending}
                onClick={() => run(() => approveApprovalItem(item.id))}
                className="min-h-9 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                ✅ 承認
              </button>
              <button
                onClick={() => setMode("edit")}
                className="min-h-9 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
              >
                ✏️ 編集して承認
              </button>
              <button
                onClick={() => setMode("reject")}
                className="min-h-9 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
              >
                ❌ 却下
              </button>
            </>
          )}
          {failed && (
            <button
              disabled={isPending}
              onClick={() => run(() => retryFailedApprovalItem(item.id))}
              className="min-h-9 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50"
            >
              🔁 再送信を許可
            </button>
          )}
        </div>
      </div>

      {/* 決定メモ */}
      {item.feedback && (
        <p className="mt-3 rounded-lg bg-zinc-950/60 p-3 text-xs text-zinc-400">
          📝 決定メモ: {item.feedback}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </article>
  );
}
