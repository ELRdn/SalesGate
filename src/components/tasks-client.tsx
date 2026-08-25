"use client";

import { CalendarDays, Columns3, List, Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentChip, Modal, PageHeader, Panel } from "@/components/ui";
import { createTask } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

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
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => initialTasks.filter((t) => `${t.title} ${t.company} ${t.agent}`.toLowerCase().includes(query.toLowerCase())), [initialTasks, query]);
  const router = useRouter();

  const overdue = initialTasks.filter((t) => t.isOverdue).length;
  const todayDue = initialTasks.filter((t) => {
    if (!t.dueAt) return false;
    const d = new Date(t.dueAt);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return d >= start && d < end && t.dbStatus !== "DONE" && t.dbStatus !== "CANCELLED";
  }).length;
  const inProgress = initialTasks.filter((t) => t.dbStatus === "IN_PROGRESS").length;
  const done = initialTasks.filter((t) => t.dbStatus === "DONE" || t.dbStatus === "CANCELLED").length;

  return (
    <div className="workspace-page">
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        action={
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={15} />
            {t("tasks.create")}
          </button>
        }
      />
      <div className="task-summary-cards">
        <TaskMetric label={t("tasks.overdue")} value={String(overdue)} tone="red" />
        <TaskMetric label={t("tasks.dueToday")} value={String(todayDue)} tone="amber" />
        <TaskMetric label={t("tasks.inProgress")} value={String(inProgress)} tone="blue" />
        <TaskMetric label={t("tasks.done")} value={String(done)} tone="green" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tasks.searchPlaceholder")} />
          </label>
          <div className="view-switch">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              <List size={15} />
              {t("tasks.list")}
            </button>
            <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>
              <Columns3 size={15} />
              {t("tasks.board")}
            </button>
          </div>
        </div>
        {view === "list" ? (
          <div className="data-table task-table">
            <div className="table-head">
              <span>{t("tasks.task")}</span>
              <span>{t("tasks.type")}</span>
              <span>{t("tasks.assignee")}</span>
              <span>{t("tasks.priority")}</span>
              <span>{t("tasks.due")}</span>
              <span>{t("tasks.status")}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 120, padding: 20 }}>
                <strong>{t("tasks.noTasks")}</strong>
                <span>{t("tasks.noTasksDesc")}</span>
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
                    {task.agent !== "—" ? <AgentChip agent={task.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} /> : <span style={{ color: "#7f90a7", fontSize: 10 }}>{t("tasks.unassigned")}</span>}
                  </span>
                  <span>
                    <Priority priority={task.priority} />
                  </span>
                  <span className="due-cell">
                    <CalendarDays size={13} />
                    {task.due}
                  </span>
                  <span>
                    <TaskStatus dbStatus={task.dbStatus} isOverdue={task.isOverdue} />
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
  const { t } = useI18n();
  const label = priority === "高" ? t("tasks.high") : priority === "中" ? t("tasks.medium") : t("tasks.low");
  const key = priority === "高" ? "high" : priority === "中" ? "mid" : "low";
  return <span className={`priority ${key}`}>{label}</span>;
}
function TaskStatus({ dbStatus, isOverdue }: { dbStatus: string; isOverdue: boolean }) {
  const { t } = useI18n();
  const statusKey = isOverdue ? "OVERDUE" : dbStatus;
  const label = t(`status.task.${statusKey}`);
  const klass = statusKey === "DONE" || statusKey === "CANCELLED" ? "sent" : statusKey === "IN_PROGRESS" ? "claimed" : statusKey === "OVERDUE" ? "failed" : "awaiting";
  return <span className={`status-pill ${klass}`}>{label}</span>;
}
function Kanban({ items }: { items: TaskRow[] }) {
  const { t } = useI18n();
  // Kanban columns translated via tasks.* keys but preserve DB enum logic
  const columns = [
    {
      key: "PENDING",
      label: t("status.task.PENDING"),
      filter: (x: TaskRow) => !x.isOverdue && x.dbStatus === "PENDING",
    },
    {
      key: "IN_PROGRESS",
      label: t("tasks.inProgress"),
      filter: (x: TaskRow) => !x.isOverdue && x.dbStatus === "IN_PROGRESS",
    },
    {
      key: "OVERDUE",
      label: t("tasks.overdue"),
      filter: (x: TaskRow) => x.isOverdue,
    },
    {
      key: "DONE",
      label: t("tasks.done"),
      filter: (x: TaskRow) => x.dbStatus === "DONE" || x.dbStatus === "CANCELLED",
    },
  ] as const;

  return (
    <div className="kanban">
      {columns.map((col) => (
        <div className="kanban-col" key={col.key}>
          <div className="kanban-head">
            <strong>{col.label}</strong>
            <span>{items.filter(col.filter).length}</span>
          </div>
          <div className="kanban-stack">
            {items
              .filter(col.filter)
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
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    if (!title.trim()) {
      setError(t("tasks.createError"));
      return;
    }
    startTransition(async () => {
      try {
        await createTask({ type: "CUSTOM", title: title.trim(), assignee: agent.trim() || undefined, dueAt: dueAt || undefined });
        onSuccess();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("tasks.createError"));
      }
    });
  };

  return (
    <Modal title={t("tasks.createModalTitle")} onClose={onClose}>
      <div className="modal-body form-stack">
        <label>
          {t("tasks.taskName")}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("tasks.taskNamePlaceholder")} />
        </label>
        <label>
          {t("tasks.assigneeLabel")}
          <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder={t("tasks.agentPlaceholder")} />
        </label>
        <label>
          {t("tasks.dueLabel")}
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
        {error ? <div className="modal-info danger-info">{error}</div> : null}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={isPending}>
          {t("common.cancel")}
        </button>
        <button className="btn primary" onClick={handle} disabled={isPending || !title.trim()}>
          {isPending ? t("common.creating") : t("common.create")}
        </button>
      </div>
    </Modal>
  );
}
