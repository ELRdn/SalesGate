import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeApprovalItem, timeAgo } from "@/lib/serialize";
import { ApprovalStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingCount, sentToday, activeLeads, pendingTasks, pendingItems, recentLogs] =
    await Promise.all([
      prisma.approvalItem.count({ where: { status: "AWAITING_APPROVAL" } }),
      prisma.messageLog.count({ where: { status: "SENT", sentAt: { gte: startOfToday } } }),
      prisma.lead.count({ where: { status: "ACTIVE" } }),
      prisma.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.approvalItem.findMany({
        where: { status: "AWAITING_APPROVAL" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { lead: true },
      }),
      prisma.messageLog.findMany({
        orderBy: { sentAt: "desc" },
        take: 8,
        include: { lead: true },
      }),
    ]);

  const stats = [
    { label: "承認待ち", value: pendingCount, color: "text-amber-400", href: "/approvals" },
    { label: "今日の送信", value: sentToday, color: "text-emerald-400", href: "/approvals?filter=sent" },
    { label: "アクティブリード", value: activeLeads, color: "text-sky-400", href: "/leads" },
    { label: "未完了タスク", value: pendingTasks, color: "text-violet-400", href: "/tasks" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="mt-1 text-sm text-zinc-500">
          営業はAIに、判断はあなたに。承認ゲートの状態を確認しましょう。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* 承認待ちリスト */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">🟡 承認待ちの下書き</h2>
            <Link href="/approvals" className="text-sm text-emerald-400 hover:underline">
              すべて見る →
            </Link>
          </div>
          {pendingItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              承認待ちはありません
            </p>
          ) : (
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <Link
                  key={item.id}
                  href="/approvals"
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{item.subject}</p>
                    <ApprovalStatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {item.lead ? item.lead.company : "リード未紐付け"} · {timeAgo(item.createdAt.toISOString())}
                    {item.submittedBy ? ` · ${item.submittedBy}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 最近の送信 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">📤 最近の送信ログ</h2>
            <Link href="/approvals?filter=sent" className="text-sm text-emerald-400 hover:underline">
              すべて見る →
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              まだ送信履歴がありません
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{log.subject}</p>
                    <span
                      className={`text-xs ${
                        log.status === "SENT" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {log.status === "SENT" ? "送信済み" : "失敗"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {log.lead ? log.lead.company : "リード未紐付け"} · {timeAgo(log.sentAt.toISOString())}
                    {log.sentBy ? ` · ${log.sentBy}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
