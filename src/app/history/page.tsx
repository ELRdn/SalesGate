"use client";

import { CheckCircle2, Download, Search, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { sendHistory } from "@/data/mock";
import { AgentChip, PageHeader, Panel } from "@/components/ui";

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("すべて");
  const rows = useMemo(() => sendHistory.filter((x) => (filter === "すべて" || x.status === filter) && `${x.company} ${x.email} ${x.subject}`.toLowerCase().includes(query.toLowerCase())), [query, filter]);

  return (
    <div className="workspace-page">
      <PageHeader title="送信履歴" description="承認後にエージェントが実行した送信結果と監査情報を確認します。" action={<button className="btn ghost"><Download size={15} />CSVエクスポート</button>} />
      <div className="metric-strip">
        <Metric label="本日送信" value="12" tone="green" />
        <Metric label="成功率" value="96.2%" tone="blue" />
        <Metric label="送信失敗" value="1" tone="red" />
        <Metric label="本文不一致" value="1" tone="amber" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="送信先・件名を検索" /></label>
          <select className="standalone-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>すべて</option><option>送信済み</option><option>送信失敗</option><option>本文不一致</option>
          </select>
        </div>
        <div className="data-table history-table">
          <div className="table-head"><span>送信先</span><span>件名</span><span>Agent</span><span>結果</span><span>本文Hash</span><span>送信日時</span></div>
          {rows.map((item) => (
            <div className="table-row static" key={item.id}>
              <span className="lead-main"><strong>{item.company}</strong><small>{item.email}</small></span>
              <span className="truncate-cell">{item.subject}</span>
              <span><AgentChip agent={item.agent} /></span>
              <span><HistoryStatus status={item.status} /></span>
              <span className={`hash-state ${item.hash === "一致" ? "ok" : item.hash === "不一致" ? "bad" : ""}`}>
                {item.hash === "一致" ? <ShieldCheck size={14} /> : item.hash === "不一致" ? <ShieldX size={14} /> : null}{item.hash}
              </span>
              <span>{item.sentAt}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="mini-metric"><i className={tone} /><span>{label}<small>直近24時間</small></span><strong>{value}</strong></div>;
}
function HistoryStatus({ status }: { status: string }) {
  const cls = status === "送信済み" ? "sent" : status === "送信失敗" ? "failed" : "rejected";
  return <span className={`status-pill ${cls}`}>{status === "送信済み" ? <CheckCircle2 size={12} /> : status === "送信失敗" ? <XCircle size={12} /> : null}{status}</span>;
}
