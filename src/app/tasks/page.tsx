"use client";

import { CalendarDays, Columns3, List, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { tasks } from "@/data/mock";
import type { Task } from "@/types";
import { AgentChip, PageHeader, Panel } from "@/components/ui";

export default function TasksPage() {
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => tasks.filter((t) => `${t.title} ${t.company} ${t.agent}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div className="workspace-page">
      <PageHeader title="タスク" description="人間とAIエージェントの営業タスクを同じキューで管理します。" action={<button className="btn primary"><Plus size={15} />タスク作成</button>} />
      <div className="task-summary-cards">
        <TaskMetric label="期限超過" value="3" tone="red" />
        <TaskMetric label="今日が期限" value="4" tone="amber" />
        <TaskMetric label="進行中" value="11" tone="blue" />
        <TaskMetric label="完了" value="27" tone="green" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="タスク・企業・Agentで検索" /></label>
          <div className="view-switch">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={15} />一覧</button>
            <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}><Columns3 size={15} />ボード</button>
          </div>
        </div>
        {view === "list" ? (
          <div className="data-table task-table">
            <div className="table-head"><span>タスク</span><span>種別</span><span>担当Agent</span><span>優先度</span><span>期限</span><span>状態</span></div>
            {filtered.map((task) => (
              <div className="table-row static" key={task.id}>
                <span className="lead-main"><strong>{task.title}</strong><small>{task.company}</small></span>
                <span><TypePill type={task.type} /></span>
                <span><AgentChip agent={task.agent} /></span>
                <span><Priority priority={task.priority} /></span>
                <span className="due-cell"><CalendarDays size={13} />{task.due}</span>
                <span><TaskStatus status={task.status} /></span>
              </div>
            ))}
          </div>
        ) : (
          <Kanban items={filtered} />
        )}
      </Panel>
    </div>
  );
}

function TaskMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="task-metric"><i className={tone} /><div><span>{label}</span><strong>{value}<small>件</small></strong></div></div>;
}
function TypePill({ type }: { type: Task["type"] }) {
  return <span className="type-pill">{type}</span>;
}
function Priority({ priority }: { priority: Task["priority"] }) {
  return <span className={`priority ${priority === "高" ? "high" : priority === "中" ? "mid" : "low"}`}>{priority}</span>;
}
function TaskStatus({ status }: { status: Task["status"] }) {
  const key = status === "完了" ? "sent" : status === "進行中" ? "claimed" : status === "期限超過" ? "failed" : "awaiting";
  return <span className={`status-pill ${key}`}>{status}</span>;
}
function Kanban({ items }: { items: Task[] }) {
  const columns: Task["status"][] = ["未着手", "進行中", "期限超過", "完了"];
  return (
    <div className="kanban">
      {columns.map((status) => (
        <div className="kanban-col" key={status}>
          <div className="kanban-head"><strong>{status}</strong><span>{items.filter((x) => x.status === status).length}</span></div>
          <div className="kanban-stack">
            {items.filter((x) => x.status === status).map((task) => (
              <article className="kanban-card" key={task.id}>
                <div><Priority priority={task.priority} /><AgentChip agent={task.agent} /></div>
                <h3>{task.title}</h3>
                <p>{task.company}</p>
                <small><CalendarDays size={12} />{task.due}</small>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
