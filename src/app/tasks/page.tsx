import { prisma } from "@/lib/prisma";
import { TaskForm } from "@/components/task-form";
import { TaskRow } from "@/components/task-row";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, leads] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { lead: true },
    }),
    prisma.lead.findMany({ orderBy: { company: "asc" }, take: 500 }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">タスク</h1>
        <p className="mt-1 text-sm text-zinc-500">
          エージェントが実行する仕事の管理。エージェントからも MCP 経由で作成・更新されます。
        </p>
      </div>

      <TaskForm
        leads={leads.map((l) => ({ id: l.id, company: l.company }))}
      />

      <div className="mt-8 space-y-3">
        <h2 className="font-semibold">タスク一覧（{tasks.length}件）</h2>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={{
              id: task.id,
              type: task.type,
              title: task.title,
              description: task.description,
              status: task.status,
              humanComment: task.humanComment,
              assignedTo: task.assignedTo,
              dueAt: task.dueAt?.toISOString() ?? null,
              company: task.lead?.company ?? null,
              email: task.lead?.email ?? null,
            }}
          />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            タスクはまだありません
          </p>
        )}
      </div>
    </div>
  );
}
