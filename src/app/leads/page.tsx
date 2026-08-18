"use client";

import { Download, Filter, Mail, Plus, Search, Upload, UserRoundPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { leads as seedLeads } from "@/data/mock";
import type { Lead } from "@/types";
import { AgentChip, Modal, PageHeader, Panel } from "@/components/ui";

export default function LeadsPage() {
  const [items, setItems] = useState(seedLeads);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("すべて");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const filtered = useMemo(() => items.filter((lead) => (status === "すべて" || lead.status === status) && `${lead.company} ${lead.person} ${lead.email}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);

  return (
    <div className="workspace-page">
      <PageHeader title="リード" description="営業対象、接触履歴、次アクションを一元管理します。" action={<div className="header-actions"><button className="btn ghost"><Download size={15} />CSV</button><button className="btn primary" onClick={() => setAdding(true)}><Plus size={15} />リード追加</button></div>} />
      <div className="metric-strip">
        <Metric label="全リード" value={items.length.toString()} sub="登録済み" tone="blue" />
        <Metric label="アクティブ" value={items.filter((x) => x.status === "アクティブ").length.toString()} sub="進行中" tone="green" />
        <Metric label="返信あり" value={items.filter((x) => x.status === "返信あり").length.toString()} sub="要対応" tone="violet" />
        <Metric label="抑制中" value={items.filter((x) => x.status === "抑制中").length.toString()} sub="送信禁止" tone="red" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="会社名・担当者・メールで検索" /></label>
          <div className="toolbar-right">
            <label className="select-wrap"><Filter size={14} /><select value={status} onChange={(e) => setStatus(e.target.value)}><option>すべて</option><option>アクティブ</option><option>返信あり</option><option>休眠</option><option>抑制中</option></select></label>
            <button className="btn ghost compact"><Upload size={14} />インポート</button>
          </div>
        </div>
        <div className="data-table lead-table">
          <div className="table-head"><span>企業 / 担当者</span><span>ステータス</span><span>担当Agent</span><span>タッチ</span><span>最終接触</span><span>次アクション</span></div>
          {filtered.map((lead) => (
            <button key={lead.id} className="table-row" onClick={() => setSelected(lead)}>
              <span className="lead-main"><strong>{lead.company}</strong><small>{lead.person} · {lead.email}</small></span>
              <span><LeadStatus status={lead.status} /></span>
              <span><AgentChip agent={lead.agent} /></span>
              <span>{lead.touches} 回</span>
              <span>{lead.lastTouch}</span>
              <span className="next-action">{lead.nextAction}</span>
            </button>
          ))}
        </div>
        <div className="table-footer"><span>{filtered.length} / {items.length} 件を表示</span><div><button disabled>前へ</button><b>1</b><button disabled>次へ</button></div></div>
      </Panel>
      {adding ? <AddLeadModal onClose={() => setAdding(false)} onAdd={(lead) => { setItems((prev) => [{ ...lead, id: Date.now(), status: "アクティブ", agent: "DSH", touches: 0, lastTouch: "未接触", nextAction: "初回営業" }, ...prev]); setAdding(false); }} /> : null}
      {selected ? (
        <Modal title="リード詳細" onClose={() => setSelected(null)}>
          <div className="modal-body lead-detail">
            <div className="detail-identity">
              <div className="identity-icon"><UserRoundPlus size={22} /></div>
              <div><h3>{selected.company}</h3><p>{selected.person}</p><a href={`mailto:${selected.email}`}><Mail size={13} />{selected.email}</a></div>
            </div>
            <div className="detail-grid">
              <div><span>ステータス</span><LeadStatus status={selected.status} /></div>
              <div><span>担当Agent</span><AgentChip agent={selected.agent} /></div>
              <div><span>タッチ回数</span><strong>{selected.touches} 回</strong></div>
              <div><span>最終接触</span><strong>{selected.lastTouch}</strong></div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setSelected(null)}>閉じる</button>
            <button className="btn primary">タスクを作成</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return <div className="mini-metric"><i className={tone} /><span>{label}<small>{sub}</small></span><strong>{value}</strong></div>;
}
function LeadStatus({ status }: { status: Lead["status"] }) {
  const key = status === "アクティブ" ? "approved" : status === "返信あり" ? "claimed" : status === "抑制中" ? "rejected" : "archived";
  return <span className={`status-pill ${key}`}>{status}</span>;
}
function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Pick<Lead, "company" | "person" | "email">) => void }) {
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Modal title="リードを追加" onClose={onClose}>
      <div className="modal-body form-grid">
        <label>会社名<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="株式会社Example" /></label>
        <label>担当者<input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="山田 太郎" /></label>
        <label className="full">メールアドレス<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@example.jp" type="email" /></label>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>キャンセル</button>
        <button className="btn primary" disabled={!company || !email} onClick={() => onAdd({ company, person, email })}>追加する</button>
      </div>
    </Modal>
  );
}
