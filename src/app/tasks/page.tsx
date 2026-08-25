import { prisma } from "@/lib/prisma";
import { TasksClient } from "@/components/tasks-client";

export const dynamic = "force-dynamic";

function mapType(t: string) {
  switch (t) {
    case "FOLLOW_UP":
      return "フォローアップ";
    case "RESEARCH":
      return "リサーチ";
    case "REVIEW_REQUEST":
      return "事前相談";
    case "MEETING_PREP":
      return "商談準備";
    case "QUOTE":
      return "見積";
    case "CONTRACT":
      return "契約";
    default:
      return "カスタム";
  }
}

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" }, include: { lead: true }, take: 500 });

  const now = new Date();
  const serialized = tasks.map((t) => {
    const isOverdue = t.dueAt && new Date(t.dueAt) < now && t.status !== "DONE" && t.status !== "CANCELLED";
    let statusLabel: "未着手" | "進行中" | "期限超過" | "完了" = "未着手";
    if (t.status === "DONE") statusLabel = "完了";
    else if (isOverdue) statusLabel = "期限超過";
    else if (t.status === "IN_PROGRESS") statusLabel = "進行中";
    else if (t.status === "PENDING") statusLabel = "未着手";
    else if (t.status === "CANCELLED") statusLabel = "完了";

    return {
      id: t.id,
      title: t.title,
      company: t.lead?.company ?? "—",
      type: mapType(t.type),
      dbType: t.type,
      status: statusLabel,
      dbStatus: t.status,
      agent: t.assignedTo ?? "—",
      due: t.dueAt ? new Date(t.dueAt).toLocaleDateString("ja-JP") : "—",
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      priority: "中" as "高" | "中" | "低",
      description: t.description ?? "",
      isOverdue: !!isOverdue,
    };
  });

  return <TasksClient initialTasks={serialized} />;
}
