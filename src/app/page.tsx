"use client";

import { CalendarClock, CheckCircle2, CircleAlert, Clock3, FileCheck2, Gauge, Inbox, ListChecks, RefreshCw, Send, Users } from "lucide-react";
import { useState } from "react";
import { initialApprovals } from "@/data/mock";
import { AgentChip, RiskChip, Panel, PanelHead, EmptyState } from "@/components/ui";
import type { Approval, PageKey } from "@/types";

const bars = [22, 18, 25, 12, 30, 28, 12];
const dates = ["8/10", "8/11", "8/12", "8/13", "8/14", "8/15", "8/16"];

export default function DashboardPage() {
  const [approvals] = useState<Approval[]>(initialApprovals);
  const pending = approvals.filter((a) => a.status === "承認待ち");

  const stats = [
    { label: "承認待ち", value: pending.length.toString(), unit: "件", sub: "前日比 ", delta: "+2", icon: CalendarClock, tone: "violet" },
    { label: "今日の送信数", value: "12", suffix: "/ 50", sub: "日次上限", progress: 24, icon: Send, tone: "green" },
    { label: "未返信タスク", value: "18", unit: "件", sub: "前日比 ", delta: "-3", icon: Clock3, tone: "orange" },
    { label: "全リード数", value: "357", unit: "件", sub: "アクティブ 142 件", icon: Users, tone: "blue" },
  ];

  return (
    <div className="dashboard-page">
      <section className="stats-grid">
        {stats.map(({ label, value, unit, suffix, sub, delta, progress, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}><Icon size={26} strokeWidth={1.8} /></div>
            <div className="stat-copy">
              <span className="stat-label">{label}</span>
              <div className="stat-number">
                <strong>{value}</strong>
                {suffix ? <b>{suffix}</b> : null}
                {unit ? <small>{unit}</small> : null}
              </div>
              {progress !== undefined ? (
                <div className="progress-row">
                  <span>{sub}</span>
                  <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                  <span>{progress}%</span>
                </div>
              ) : (
                <div className="stat-sub">{sub}<b>{delta}</b></div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="left-stack">
          <Panel className="approvals-panel">
            <PanelHead
              title="承認キュー"
              meta={`（最新 ${Math.min(5, pending.length)} 件）`}
              action={<button className="text-link">すべて表示</button>}
            />
            <div className="approval-list">
              {pending.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={30} />} title="承認待ちはありません" text="エージェントが新しい下書きを提出するとここに表示されます。" />
              ) : (
                pending.slice(0, 5).map((item) => (
                  <div className="approval-row" key={item.id}>
                    <div className="lead-cell">
                      <strong>{item.company}</strong>
                      <span>{item.person}</span>
                      <small>{item.email}</small>
                    </div>
                    <div><AgentChip agent={item.agent} /></div>
                    <div className="subject-cell">
                      <strong>{item.subject}</strong>
                      <span>{item.note}</span>
                    </div>
                    <div><RiskChip risk={item.risk} /></div>
                    <div className="actions-cell">
                      <span className="row-time">{item.time}</span>
                      <div>
                        <button className="approve">承認</button>
                        <button className="edit">編集</button>
                        <button className="reject">却下</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <div className="bottom-grid">
            <Panel className="chart-panel">
              <PanelHead
                title="送信数の推移"
                meta="（過去 7 日間）"
                action={
                  <div className="legend">
                    <span><i className="legend-bar" />送信数</span>
                    <span><i className="legend-line" />上限</span>
                  </div>
                }
              />
              <div className="chart-area">
                <div className="y-axis">
                  <span>60</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span>
                </div>
                <div className="plot">
                  <div className="limit-line" />
                  {bars.map((value, idx) => (
                    <div className="bar-col" key={dates[idx]}>
                      <span>{value}</span>
                      <i style={{ height: `${Math.max(18, value * 3.2)}px` }} />
                      <small>{dates[idx]}</small>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel className="alerts-panel">
              <PanelHead title="リスクアラート" />
              <Alert tone="red" icon={<CircleAlert size={17} />} title="重複リード検出" body="株式会社ABC Corp. に類似リードが 2 件存在します" time="2時間前" />
              <Alert tone="amber" icon={<CircleAlert size={17} />} title="抑制リスト一致" body="test@example.com が抑制リストに登録されています" time="5時間前" />
              <Alert tone="blue" icon={<Gauge size={17} />} title="日次上限に近づいています" body="今日の送信数が上限の 80% に達しています" time="6時間前" />
            </Panel>
          </div>
        </div>

        <div className="right-stack">
          <Panel className="task-panel">
            <PanelHead title="タスクサマリー" action={<button className="text-link">すべて表示</button>} />
            <TaskRow tone="red" icon={<FileCheck2 size={17} />} label="期限超過" count="3" />
            <TaskRow tone="amber" icon={<CalendarClock size={17} />} label="今日が期限" count="4" />
            <TaskRow tone="blue" icon={<ListChecks size={17} />} label="今週中" count="11" />
            <TaskRow tone="green" icon={<CheckCircle2 size={17} />} label="完了" count="27" />
            <div className="unreplied">
              <div className="task-icon blue"><Inbox size={17} /></div>
              <div><strong>未返信リード</strong><span>3日以上返信がないリード</span></div>
              <b>18<small>件</small></b>
            </div>
            <button className="followup"><RefreshCw size={14} />今すぐフォローアップ生成</button>
          </Panel>
          <Panel className="activity-panel">
            <PanelHead title="最近のアクティビティ" />
            <Activity tone="green" title="承認されました" body="[株式会社Test Corp.] のメールが承認されました" time="30分前" />
            <Activity tone="green" title="メール送信完了" body="[株式会社Sample] へのメール送信が完了しました" time="1時間前" />
            <Activity tone="blue" title="新しい下書きが提出されました" body="[株式会社New Co.] から下書きが提出されました" time="2時間前" />
            <Activity tone="amber" title="タスクが作成されました" body="[フォローアップ] タスクが作成されました" time="3時間前" />
            <button className="activity-link">すべてのアクティビティを表示 →</button>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Alert({ tone, icon, title, body, time }: { tone: string; icon: React.ReactNode; title: string; body: string; time: string }) {
  return <div className="alert-row"><div className={`alert-icon ${tone}`}>{icon}</div><div><strong>{title}</strong><span>{body}</span></div><small>{time}</small></div>;
}
function TaskRow({ tone, icon, label, count }: { tone: string; icon: React.ReactNode; label: string; count: string }) {
  return <div className="task-row"><div className={`task-icon ${tone}`}>{icon}</div><strong>{label}</strong><b className={tone}>{count}<small>件</small></b></div>;
}
function Activity({ tone, title, body, time }: { tone: string; title: string; body: string; time: string }) {
  return <div className="activity-row"><div className={`activity-icon ${tone}`}><CheckCircle2 size={16} /></div><div><strong>{title}</strong><span>{body}</span></div><small>{time}</small></div>;
}
