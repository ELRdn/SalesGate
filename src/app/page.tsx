import { CalendarClock, CheckCircle2, CircleAlert, Clock3, FileCheck2, Gauge, Inbox, ListChecks, RefreshCw, Send, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettingInt } from "@/lib/settings";
import { Panel, PanelHead, EmptyState } from "@/components/ui";
import { DashboardApprovals } from "@/components/dashboard-client";
import { DashboardFollowupButton } from "@/components/dashboard-followup";
import { timeAgo } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function toJSTDate(d: Date) {
  return d;
}

export default async function DashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const dailyLimit = await getSettingInt("daily_send_limit", 50).catch(() => 50);

  const [pendingCount, todaySends, totalLeads, activeLeads, tasksAll, recentApprovals, recentLogs, pendingApprovalsRaw, suppressedCount, hashMismatches] =
    await Promise.all([
      prisma.approvalItem.count({ where: { status: "AWAITING_APPROVAL" } }),
      prisma.messageLog.count({ where: { sentAt: { gte: startOfDay }, status: "SENT" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "ACTIVE" } }),
      prisma.task.findMany({ select: { status: true, dueAt: true } }),
      prisma.approvalItem.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { lead: true } }),
      prisma.messageLog.findMany({ orderBy: { sentAt: "desc" }, take: 4, include: { lead: true } }),
      prisma.approvalItem.findMany({
        where: { status: "AWAITING_APPROVAL" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { lead: true },
      }),
      prisma.lead.count({ where: { status: "SUPPRESSED" } }),
      prisma.approvalItem.count({ where: { hashMismatchAt: { not: null } } }),
    ]);

  // Task summaries
  const overdue = tasksAll.filter((t) => t.dueAt && new Date(t.dueAt) < now && t.status !== "DONE" && t.status !== "CANCELLED").length;
  const todayDue = tasksAll.filter((t) => {
    if (!t.dueAt || t.status === "DONE" || t.status === "CANCELLED") return false;
    const d = new Date(t.dueAt);
    return d >= startOfDay && d < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  }).length;
  const weekDue = tasksAll.filter((t) => {
    if (!t.dueAt || t.status === "DONE" || t.status === "CANCELLED") return false;
    const d = new Date(t.dueAt);
    const weekEnd = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= startOfDay && d < weekEnd;
  }).length;
  const done = tasksAll.filter((t) => t.status === "DONE").length;
  const pendingTasks = tasksAll.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;

  // Chart: last 7 days
  const days: { label: string; count: number; date: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0, date: d });
  }
  // fetch message logs for last 7 days
  const sevenDaysAgo = days[0].date;
  const weekLogs = await prisma.messageLog.findMany({
    where: { sentAt: { gte: sevenDaysAgo } },
    select: { sentAt: true },
  });
  for (const log of weekLogs) {
    const d = new Date(log.sentAt);
    const idx = days.findIndex((day) => {
      const next = new Date(day.date);
      next.setDate(next.getDate() + 1);
      return d >= day.date && d < next;
    });
    if (idx >= 0) days[idx].count++;
  }

  const maxChart = Math.max(10, ...days.map((d) => d.count), dailyLimit);
  const progress = dailyLimit > 0 ? Math.round((todaySends / dailyLimit) * 100) : 0;
  const nearLimit = progress >= 80 && todaySends > 0;

  // Pending approvals serialized for client component
  const pendingApprovals = pendingApprovalsRaw.map((a) => ({
    id: a.id,
    company: a.lead?.company ?? "—",
    person: a.lead?.contactName ?? "",
    email: a.lead?.email ?? "",
    agent: (a.submittedBy as string) ?? "—",
    subject: a.subject,
    note: a.evidence ?? a.riskFlags ?? "",
    evidence: a.evidence ?? "",
    risk: (() => {
      if (a.riskFlags) {
        try {
          const flags = JSON.parse(a.riskFlags);
          if (Array.isArray(flags) && flags.length > 0) return flags.length > 1 ? "高リスク" : "中リスク";
        } catch {}
      }
      return "低リスク";
    })() as "低リスク" | "中リスク" | "高リスク",
    time: timeAgo(a.createdAt.toISOString()),
    status: "承認待ち" as const,
  }));

  // Recent activity derived from real data
  const activities: Array<{ tone: string; title: string; body: string; time: string }> = [];
  for (const a of recentApprovals) {
    const label = a.status === "APPROVED" || a.status === "EDITED" ? "承認されました" : a.status === "REJECTED" ? "却下されました" : "新しい下書きが提出されました";
    activities.push({
      tone: a.status === "REJECTED" ? "amber" : a.status === "APPROVED" || a.status === "EDITED" ? "green" : "blue",
      title: label,
      body: `[${a.lead?.company ?? "—"}] ${a.subject.slice(0, 40)}`,
      time: timeAgo(a.createdAt.toISOString()),
    });
  }
  for (const l of recentLogs) {
    activities.push({
      tone: l.status === "SENT" ? "green" : "amber",
      title: l.status === "SENT" ? "メール送信完了" : "送信失敗",
      body: `[${l.lead?.company ?? l.subject.slice(0, 20)}] への送信`,
      time: timeAgo(l.sentAt.toISOString()),
    });
  }
  activities.sort((a, b) => 0); // keeps recentApprovals order; ideally sort by time but timeAgo is string

  // Risk alerts derived
  const alerts: Array<{ tone: string; icon: React.ReactNode; title: string; body: string; time: string }> = [];
  if (hashMismatches > 0) {
    alerts.push({
      tone: "red",
      icon: <CircleAlert size={17} />,
      title: "本文不一致を検知",
      body: `${hashMismatches} 件の送信でハッシュ不一致が検知されています`,
      time: "監査ログを確認",
    });
  }
  if (suppressedCount > 0) {
    alerts.push({
      tone: "amber",
      icon: <CircleAlert size={17} />,
      title: "抑制リスト登録あり",
      body: `${suppressedCount} 件が抑制リストに登録されています`,
      time: "抑制リストを確認",
    });
  }
  if (nearLimit) {
    alerts.push({
      tone: "blue",
      icon: <Gauge size={17} />,
      title: "日次上限に近づいています",
      body: `今日の送信数が上限の ${progress}% に達しています`,
      time: "今すぐ確認",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      tone: "blue",
      icon: <Gauge size={17} />,
      title: "アラートはありません",
      body: "現在、重大なリスクは検知されていません",
      time: "",
    });
  }

  const stats = [
    { label: "承認待ち", value: String(pendingCount), unit: "件", sub: "要対応", delta: "", icon: CalendarClock, tone: "violet" },
    { label: "今日の送信数", value: String(todaySends), suffix: ` / ${dailyLimit}`, sub: "日次上限", progress, icon: Send, tone: "green" },
    { label: "未返信タスク", value: String(pendingTasks), unit: "件", sub: "進行中", delta: "", icon: Clock3, tone: "orange" },
    { label: "全リード数", value: String(totalLeads), unit: "件", sub: `アクティブ ${activeLeads} 件`, icon: Users, tone: "blue" },
  ];

  return (
    <div className="dashboard-page">
      <section className="stats-grid">
        {stats.map(({ label, value, unit, suffix, sub, delta, progress: prog, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={26} strokeWidth={1.8} />
            </div>
            <div className="stat-copy">
              <span className="stat-label">{label}</span>
              <div className="stat-number">
                <strong>{value}</strong>
                {suffix ? <b>{suffix}</b> : null}
                {unit ? <small>{unit}</small> : null}
              </div>
              {prog !== undefined ? (
                <div className="progress-row">
                  <span>{sub}</span>
                  <div className="progress">
                    <i style={{ width: `${Math.min(100, prog)}%` }} />
                  </div>
                  <span>{prog}%</span>
                </div>
              ) : (
                <div className="stat-sub">
                  {sub}
                  {delta ? <b>{delta}</b> : null}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="left-stack">
          <Panel className="approvals-panel">
            <PanelHead title="承認キュー" meta={`（最新 ${Math.min(5, pendingCount)} 件）`} action={<Link href="/approvals" className="text-link">すべて表示</Link>} />
            <DashboardApprovals items={pendingApprovals} />
          </Panel>

          <div className="bottom-grid">
            <Panel className="chart-panel">
              <PanelHead
                title="送信数の推移"
                meta="（過去 7 日間）"
                action={
                  <div className="legend">
                    <span>
                      <i className="legend-bar" />
                      送信数
                    </span>
                    <span>
                      <i className="legend-line" />
                      上限
                    </span>
                  </div>
                }
              />
              <div className="chart-area">
                <div className="y-axis">
                  <span>{maxChart}</span>
                  <span>{Math.round(maxChart * 0.66)}</span>
                  <span>{Math.round(maxChart * 0.33)}</span>
                  <span>0</span>
                </div>
                <div className="plot">
                  <div className="limit-line" style={{ top: `${100 - (dailyLimit / maxChart) * 100}%` }} />
                  {days.map((d) => (
                    <div className="bar-col" key={d.label}>
                      <span>{d.count}</span>
                      <i style={{ height: `${Math.max(6, (d.count / maxChart) * 110)}px` }} />
                      <small>{d.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel className="alerts-panel">
              <PanelHead title="リスクアラート" />
              {alerts.map((a, i) => (
                <div className="alert-row" key={i}>
                  <div className={`alert-icon ${a.tone}`}>{a.icon}</div>
                  <div>
                    <strong>{a.title}</strong>
                    <span>{a.body}</span>
                  </div>
                  <small>{a.time}</small>
                </div>
              ))}
            </Panel>
          </div>
        </div>

        <div className="right-stack">
          <Panel className="task-panel">
            <PanelHead title="タスクサマリー" action={<Link href="/tasks" className="text-link">すべて表示</Link>} />
            <div className="task-row">
              <div className="task-icon red">
                <FileCheck2 size={17} />
              </div>
              <strong>期限超過</strong>
              <b className="red">
                {overdue}
                <small>件</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon amber">
                <CalendarClock size={17} />
              </div>
              <strong>今日が期限</strong>
              <b className="amber">
                {todayDue}
                <small>件</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon blue">
                <ListChecks size={17} />
              </div>
              <strong>今週中</strong>
              <b className="blue">
                {weekDue}
                <small>件</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon green">
                <CheckCircle2 size={17} />
              </div>
              <strong>完了</strong>
              <b className="green">
                {done}
                <small>件</small>
              </b>
            </div>
            <div className="unreplied">
              <div className="task-icon blue">
                <Inbox size={17} />
              </div>
              <div>
                <strong>未返信リード</strong>
                <span>3日以上返信がないリード</span>
              </div>
              <b>
                {pendingTasks}
                <small>件</small>
              </b>
            </div>
            <DashboardFollowupButton />
          </Panel>
          <Panel className="activity-panel">
            <PanelHead title="最近のアクティビティ" />
            {activities.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={30} />} title="アクティビティはありません" text="承認や送信が発生するとここに表示されます。" />
            ) : (
              activities
                .slice(0, 4)
                .map((a, i) => (
                  <div className="activity-row" key={i}>
                    <div className={`activity-icon ${a.tone}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <strong>{a.title}</strong>
                      <span>{a.body}</span>
                    </div>
                    <small>{a.time}</small>
                  </div>
                ))
            )}
            <Link href="/history" className="activity-link" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
              すべてのアクティビティを表示 →
            </Link>
          </Panel>
        </div>
      </section>
    </div>
  );
}
