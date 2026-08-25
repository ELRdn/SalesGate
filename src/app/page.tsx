import { CalendarClock, CheckCircle2, CircleAlert, Clock3, FileCheck2, Gauge, Inbox, ListChecks, Send, Users } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSettingInt } from "@/lib/settings";
import { Panel, PanelHead, EmptyState } from "@/components/ui";
import { DashboardApprovals } from "@/components/dashboard-client";
import { DashboardFollowupButton } from "@/components/dashboard-followup";
import { Onboarding } from "@/components/onboarding";
import { getLocale } from "@/i18n/locale";
import { formatRelativeTime, formatNumber } from "@/i18n/format";
import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

function toJSTDate(d: Date) {
  return d;
}

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ja: ja as Record<string, unknown>,
};

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

function createTranslator(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) => {
    const dict = dictionaries[locale] ?? dictionaries.en;
    let str = getByPath(dict, key) ?? getByPath(dictionaries.en, key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  };
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const dailyLimit = await getSettingInt("daily_send_limit", 50).catch(() => 50);

  const [pendingCount, todaySends, totalLeads, activeLeads, tasksAll, recentApprovals, recentLogs, pendingApprovalsRaw, suppressedCount, hashMismatches, totalApprovals, reviewedCount] =
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
      prisma.approvalItem.count(),
      prisma.approvalItem.count({ where: { status: { in: ["APPROVED", "EDITED", "REJECTED", "SENT", "CLAIMED", "FAILED"] } } }),
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
    time: formatRelativeTime(a.createdAt.toISOString(), locale),
    status: "承認待ち" as const,
  }));

  // Recent activity derived from real data
  const activities: Array<{ tone: string; title: string; body: string; time: string }> = [];
  for (const a of recentApprovals) {
    const label =
      a.status === "APPROVED" || a.status === "EDITED"
        ? t("dashboard.approved")
        : a.status === "REJECTED"
          ? t("status.approval.REJECTED")
          : t("dashboard.newDraft");
    activities.push({
      tone: a.status === "REJECTED" ? "amber" : a.status === "APPROVED" || a.status === "EDITED" ? "green" : "blue",
      title: label,
      body: `[${a.lead?.company ?? "—"}] ${a.subject.slice(0, 40)}`,
      time: formatRelativeTime(a.createdAt.toISOString(), locale),
    });
  }
  for (const l of recentLogs) {
    activities.push({
      tone: l.status === "SENT" ? "green" : "amber",
      title: l.status === "SENT" ? t("dashboard.emailSent") : t("history.failed"),
      body: `[${l.lead?.company ?? l.subject.slice(0, 20)}] ${l.status === "SENT" ? t("dashboard.emailSent") : t("history.failed")}`,
      time: formatRelativeTime(l.sentAt.toISOString(), locale),
    });
  }
  activities.sort((a, b) => 0); // keeps recentApprovals order; ideally sort by time but timeAgo is string

  // Risk alerts derived
  const alerts: Array<{ tone: string; icon: React.ReactNode; title: string; body: string; time: string }> = [];
  if (hashMismatches > 0) {
    alerts.push({
      tone: "red",
      icon: <CircleAlert size={17} />,
      title: t("history.hashMismatch"),
      body: `${formatNumber(hashMismatches, locale)} ${t("history.hashMismatch")} ${locale === "ja" ? "が検知されています" : "detected"}`,
      time: t("history.title"),
    });
  }
  if (suppressedCount > 0) {
    alerts.push({
      tone: "amber",
      icon: <CircleAlert size={17} />,
      title: t("dashboard.suppressionMatch"),
      body: `${formatNumber(suppressedCount, locale)} ${locale === "ja" ? "件が抑制リストに登録されています" : "leads on suppression list"}`,
      time: t("suppression.title"),
    });
  }
  if (nearLimit) {
    alerts.push({
      tone: "blue",
      icon: <Gauge size={17} />,
      title: t("dashboard.dailyLimitNear"),
      body: `${t("dashboard.dailyLimit")} ${progress}%`,
      time: t("common.retry"),
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      tone: "blue",
      icon: <Gauge size={17} />,
      title: t("dashboard.noAlerts"),
      body: t("dashboard.noAlertsDesc"),
      time: "",
    });
  }

  const stats = [
    { label: t("dashboard.pendingApprovals"), value: formatNumber(pendingCount, locale), unit: "", sub: t("dashboard.needsAttention"), delta: "", icon: CalendarClock, tone: "violet" },
    { label: t("dashboard.todaysSends"), value: formatNumber(todaySends, locale), suffix: ` / ${formatNumber(dailyLimit, locale)}`, sub: t("dashboard.dailyLimit"), progress, icon: Send, tone: "green" },
    { label: t("dashboard.pendingTasks"), value: formatNumber(pendingTasks, locale), unit: "", sub: t("tasks.inProgress"), delta: "", icon: Clock3, tone: "orange" },
    { label: t("dashboard.totalLeads"), value: formatNumber(totalLeads, locale), unit: "", sub: t("dashboard.activeLeads", { count: formatNumber(activeLeads, locale) }), icon: Users, tone: "blue" },
  ];

  const isFirstRun = pendingCount === 0 && totalLeads === 0 && tasksAll.length === 0 && recentLogs.length === 0 && recentApprovals.length === 0;
  let mcpEndpoint = "/mcp";
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) mcpEndpoint = `${proto}://${host}/mcp`;
  } catch {}

  // Onboarding progress derived from real state (no fake hardcode)
  const hasPassword = !!process.env.SALESGATE_PASSWORD;
  const onboardingState = {
    secure: hasPassword,
    connected: totalApprovals > 0,
    submitted: totalApprovals > 0,
    reviewed: reviewedCount > 0,
  };

  if (isFirstRun) {
    return (
      <div className="dashboard-page">
        <Onboarding mcpEndpoint={mcpEndpoint} state={onboardingState} />
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
      </div>
    );
  }

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
            <PanelHead title={t("dashboard.approvalQueue")} meta={t("dashboard.latest", { count: Math.min(5, pendingCount) })} action={<Link href="/approvals" className="text-link">{t("dashboard.viewAll")}</Link>} />
            <DashboardApprovals items={pendingApprovals} />
          </Panel>

          <div className="bottom-grid">
            <Panel className="chart-panel">
              <PanelHead
                title={t("dashboard.sendTrend")}
                meta={t("dashboard.last7Days")}
                action={
                  <div className="legend">
                    <span>
                      <i className="legend-bar" />
                      {t("dashboard.sends")}
                    </span>
                    <span>
                      <i className="legend-line" />
                      {t("dashboard.limit")}
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
              <PanelHead title={t("dashboard.riskAlerts")} />
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
            <PanelHead title={t("dashboard.taskSummary")} action={<Link href="/tasks" className="text-link">{t("dashboard.viewAll")}</Link>} />
            <div className="task-row">
              <div className="task-icon red">
                <FileCheck2 size={17} />
              </div>
              <strong>{t("dashboard.overdue")}</strong>
              <b className="red">
                {formatNumber(overdue, locale)}
                <small>{locale === "ja" ? "件" : ""}</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon amber">
                <CalendarClock size={17} />
              </div>
              <strong>{t("dashboard.dueToday")}</strong>
              <b className="amber">
                {formatNumber(todayDue, locale)}
                <small>{locale === "ja" ? "件" : ""}</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon blue">
                <ListChecks size={17} />
              </div>
              <strong>{t("dashboard.dueThisWeek")}</strong>
              <b className="blue">
                {formatNumber(weekDue, locale)}
                <small>{locale === "ja" ? "件" : ""}</small>
              </b>
            </div>
            <div className="task-row">
              <div className="task-icon green">
                <CheckCircle2 size={17} />
              </div>
              <strong>{t("dashboard.done")}</strong>
              <b className="green">
                {formatNumber(done, locale)}
                <small>{locale === "ja" ? "件" : ""}</small>
              </b>
            </div>
            <div className="unreplied">
              <div className="task-icon blue">
                <Inbox size={17} />
              </div>
              <div>
                <strong>{t("dashboard.unrepliedLeads")}</strong>
                <span>{t("dashboard.unrepliedDesc")}</span>
              </div>
              <b>
                {formatNumber(pendingTasks, locale)}
                <small>{locale === "ja" ? "件" : ""}</small>
              </b>
            </div>
            <DashboardFollowupButton />
          </Panel>
          <Panel className="activity-panel">
            <PanelHead title={t("dashboard.recentActivity")} />
            {activities.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={30} />} title={t("dashboard.noActivity")} text={t("dashboard.noActivityDesc")} />
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
              {t("dashboard.viewAllActivity")}
            </Link>
          </Panel>
        </div>
      </section>
    </div>
  );
}
