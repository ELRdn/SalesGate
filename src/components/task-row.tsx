"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus, respondToTask } from "@/lib/actions";
import { Badge, TASK_STATUS_COLOR, TASK_STATUS_LABEL, TASK_TYPE_LABEL } from "./status-badge";

export function TaskRow({
  task,
}: {
  task: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    status: string;
    humanComment: string | null;
    dueAt: string | null;
    company: string | null;
    email: string | null;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [responding, setResponding] = useState(false);

  const changeStatus = (status: string) => {
    startTransition(async () => {
      await updateTaskStatus(task.id, status as never);
    });
  };

  const respond = () => {
    startTransition(async () => {
      await respondToTask(task.id, comment);
      setComment("");
      setResponding(false);
    });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">{TASK_TYPE_LABEL[task.type] ?? task.type}</span>
            <h3 className="truncate font-medium">{task.title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {task.company ?? "リード未紐付け"}
            {task.email ? ` <${task.email}>` : ""}
            {task.dueAt ? ` · 期限 ${new Date(task.dueAt).toLocaleString("ja-JP")}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={isPending}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
          >
            {Object.entries(TASK_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Badge color={TASK_STATUS_COLOR[task.status] ?? "zinc"}>
            {TASK_STATUS_LABEL[task.status] ?? task.status}
          </Badge>
        </div>
      </div>

      {task.description && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-950/60 p-3 text-sm text-zinc-400">
          {task.description}
        </p>
      )}

      {task.humanComment && (
        <p className="mt-2 rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-300 ring-1 ring-emerald-900/40">
          👤 回答: {task.humanComment}
        </p>
      )}

      {responding ? (
        <div className="mt-3 flex gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="エージェントへの回答を入力"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            disabled={isPending || !comment.trim()}
            onClick={respond}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            送信
          </button>
        </div>
      ) : (
        <button
          onClick={() => setResponding(true)}
          className="mt-3 text-sm text-emerald-400 hover:underline"
        >
          👤 回答する
        </button>
      )}
    </div>
  );
}
