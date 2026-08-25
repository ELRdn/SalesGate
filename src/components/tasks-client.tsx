"use client";

import { CalendarDays, Columns3, List, Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentChip, Modal, PageHeader, Panel } from "@/components/ui";
import { createTask } from "@/lib/actions";

type TaskRow = {
  id: string;
  title: string;
  company: string;
  type: string;
  dbType: string;
  status: "未着手" | "進行中" | "期限超過" | "完了";
  dbStatus: string;
  agent: string;
  due: string;
  dueAt: string | null;
  priority: "高" | "中" | "低";
  description: string;
  isOverdue: boolean;
};

export function TasksClient({ initialTasks }: { initialTasks: TaskRow[] }) {
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => initialTasks.filter((t) => `${t.title} ${t.company} ${t.agent}`.toLowerCase().includes(query.toLowerCase())), [initialTasks, query]);
  const router = useRouter();

  const overdue = initialTasks.filter((t) => t.status === "期限超過").length;
  const todayDue = initialTasks.filter((t) => {
    if (!t.dueAt) return false;
    const d = new Date(t.dueAt);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return d >= start && d < end && t.status !== "完了";
  }).length;
  const inProgress = initialTasks.filter((t) => t.status === "進行中").length;
  const done = initialTasks.filter((t) => t.status === "完了").length;

  return (
    <div className="workspace-page">
      <PageHeader
        title="タスク"
        description="人間とAIエージェントの営業タスクを同じキューで管理します。"
        action={
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={15} />
            タスク作成
          </button>
        }
      />
      <div className="task-summary-cards">
        <TaskMetric label="期限超過" value={String(overdue)} tone="red" />
        <TaskMetric label="今日が期限" value={String(todayDue)} tone="amber" />
        <TaskMetric label="進行中" value={String(inProgress)} tone="blue" />
        <TaskMetric label="完了" value={String(done)} tone="green" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="タスク・企業・Agentで検索" />
          </label>
          <div className="view-switch">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              <List size={15} />
              一覧
            </button>
            <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>
              <Columns3 size={15} />
              ボード
            </button>
          </div>
        </div>
        {view === "list" ? (
          <div className="data-table task-table">
            <div className="table-head">
              <span>タスク</span>
              <span>種別</span>
              <span>担当Agent</span>
              <span>優先度</span>
              <span>期限</span>
              <span>状態</span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 120, padding: 20 }}>
                <strong>タスクはありません</strong>
                <span>新しいタスクを作成するか、MCPから作成してください。</span>
              </div>
            ) : (
              filtered.map((task) => (
                <div className="table-row static" key={task.id}>
                  <span className="lead-main">
                    <strong>{task.title}</strong>
                    <small>{task.company}</small>
                  </span>
                  <span>
                    <TypePill type={task.type} />
                  </span>
                  <span>
                    {task.agent !== "—" ? <AgentChip agent={task.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} /> : <span style={{ color: "#7f90a7", fontSize: 10 }}>未割当</span>}
                  </span>
                  <span>
                    <Priority priority={task.priority} />
                  </span>
                  <span className="due-cell">
                    <CalendarDays size={13} />
                    {task.due}
                  </span>
                  <span>
                    <TaskStatus status={task.status} />
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <Kanban items={filtered} />
        )}
      </Panel>
      {adding ? (
        <CreateTaskModal
          onClose={() => setAdding(false)}
          onSuccess={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function TaskMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="task-metric">
      <i className={tone} />
      <div>
        <span>{label}</span>
        <strong>
          {value}
          <small>件</small>
        </strong>
      </div>
    </div>
  );
}
function TypePill({ type }: { type: string }) {
  return <span className="type-pill">{type}</span>;
}
function Priority({ priority }: { priority: TaskRow["priority"] }) {
  return <span className={`priority ${priority === "高" ? "high" : priority === "中" ? "mid" : "low"}`}>{priority}</span>;
}
function TaskStatus({ status }: { status: TaskRow["status"] }) {
  const key = status === "完了" ? "sent" : status === "進行中" ? "claimed" : status === "期限超過" ? "failed" : "awaiting";
  return <span className={`status-pill ${key}`}>{status}</span>;
}
function Kanban({ items }: { items: TaskRow[] }) {
  const columns: TaskRow["status"][] = ["未着手", "進行中", "期限超過", "完了"];
  return (
    <div className="kanban">
      {columns.map((status) => (
        <div className="kanban-col" key={status}>
          <div className="kanban-head">
            <strong>{status}</strong>
            <span>{items.filter((x) => x.status === status).length}</span>
          </div>
          <div className="kanban-stack">
            {items
              .filter((x) => x.status === status)
              .map((task) => (
                <article className="kanban-card" key={task.id}>
                  <div>
                    <Priority priority={task.priority} />
                    {task.agent !== "—" ? <AgentChip agent={task.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} /> : null}
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.company}</p>
                  <small>
                    <CalendarDays size={12} />
                    {task.due}
                  </small>
                </article>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateTaskModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    if (!title.trim()) {
      setError("タスク名は必須です");
      return;
    }
    startTransition(async () => {
      try {
        await createTask({ type: "CUSTOM", title: title.trim(), assignee: agent.trim() || undefined, dueAt: dueAt || undefined });
        onSuccess();
      } catch (e) {
        setError(e instanceof Error ? e.message : "作成に失敗しました");
      }
    });
  };

  return (
    <Modal title="タスクを作成" onClose={onClose}>
      <div className="modal-body form-stack">
        <label>
          タスク名
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 新規リードへのフォローアップ" />
        </label>
        <label>
          担当エージェント（任意）
          <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="DSH" />
        </label>
        <label>
          期限（任意）
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
        {error ? <div className="modal-info danger-info">{error}</div> : null}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={isPending}>
          キャンセル
        </button>
        <button className="btn primary" onClick={handle} disabled={isPending || !title.trim()}>
          {isPending ? "作成中..." : "作成する"}
        </button>
      </div>
    </Modal>
  );
}
