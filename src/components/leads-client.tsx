"use client";

import { Download, Filter, Mail, Plus, Search, Upload, UserRoundPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader, Panel } from "@/components/ui";
import { addLead, importLeadsCsv } from "@/lib/actions";
import { timeAgo } from "@/lib/serialize";

type LeadRow = {
  id: string;
  company: string;
  person: string;
  email: string;
  status: "アクティブ" | "返信あり" | "休眠" | "抑制中";
  dbStatus: string;
  touches: number;
  lastTouch: string;
  lastTouchLabel: string;
  nextAction: string;
  notes: string;
  createdAt: string;
};

export function LeadsClient({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("すべて");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      initialLeads.filter(
        (lead) => (status === "すべて" || lead.status === status) && `${lead.company} ${lead.person} ${lead.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [initialLeads, query, status],
  );

  const handleAdd = (company: string, person: string, email: string) => {
    startTransition(async () => {
      try {
        await addLead({ company, contactName: person, email });
        setAdding(false);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "追加に失敗しました");
      }
    });
  };

  const handleCsvImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      startTransition(async () => {
        try {
          const res = await importLeadsCsv(text);
          alert(`${res.added} 件追加、${res.skipped} 件スキップしました`);
          router.refresh();
        } catch (e) {
          alert(e instanceof Error ? e.message : "インポートに失敗しました");
        }
      });
    };
    input.click();
  };

  const handleExport = () => {
    window.location.href = "/api/export/leads";
  };

  return (
    <div className="workspace-page">
      <PageHeader
        title="リード"
        description="営業対象、接触履歴、次アクションを一元管理します。"
        action={
          <div className="header-actions">
            <button className="btn ghost" onClick={handleExport}>
              <Download size={15} />
              CSV
            </button>
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Plus size={15} />
              リード追加
            </button>
          </div>
        }
      />
      <div className="metric-strip">
        <Metric label="全リード" value={String(initialLeads.length)} sub="登録済み" tone="blue" />
        <Metric label="アクティブ" value={String(initialLeads.filter((x) => x.status === "アクティブ").length)} sub="進行中" tone="green" />
        <Metric label="返信あり" value={String(initialLeads.filter((x) => x.status === "返信あり").length)} sub="要対応" tone="violet" />
        <Metric label="抑制中" value={String(initialLeads.filter((x) => x.status === "抑制中").length)} sub="送信禁止" tone="red" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="会社名・担当者・メールで検索" />
          </label>
          <div className="toolbar-right">
            <label className="select-wrap">
              <Filter size={14} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>すべて</option>
                <option>アクティブ</option>
                <option>返信あり</option>
                <option>休眠</option>
                <option>抑制中</option>
              </select>
            </label>
            <button className="btn ghost compact" onClick={handleCsvImport} disabled={isPending}>
              <Upload size={14} />
              インポート
            </button>
          </div>
        </div>
        <div className="data-table lead-table">
          <div className="table-head">
            <span>企業 / 担当者</span>
            <span>ステータス</span>
            <span>メール</span>
            <span>タッチ</span>
            <span>最終接触</span>
            <span>次アクション</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120, padding: 20 }}>
              <strong>該当するリードはありません</strong>
              <span>検索条件を変更するか、新しいリードを追加してください。</span>
            </div>
          ) : (
            filtered.map((lead) => (
              <button key={lead.id} className="table-row" onClick={() => setSelected(lead)}>
                <span className="lead-main">
                  <strong>{lead.company}</strong>
                  <small>
                    {lead.person} · {lead.email}
                  </small>
                </span>
                <span>
                  <LeadStatus status={lead.status} />
                </span>
                <span className="truncate-cell" style={{ fontSize: 10 }}>{lead.email}</span>
                <span>{lead.touches} 回</span>
                <span>{lead.lastTouch ? timeAgo(lead.lastTouch) : "未接触"}</span>
                <span className="next-action">{lead.nextAction}</span>
              </button>
            ))
          )}
        </div>
        <div className="table-footer">
          <span>
            {filtered.length} / {initialLeads.length} 件を表示
          </span>
          <div>
            <button disabled>前へ</button>
            <b>1</b>
            <button disabled>次へ</button>
          </div>
        </div>
      </Panel>
      {adding ? <AddLeadModal onClose={() => setAdding(false)} onAdd={handleAdd} pending={isPending} /> : null}
      {selected ? (
        <Modal title="リード詳細" onClose={() => setSelected(null)}>
          <div className="modal-body lead-detail">
            <div className="detail-identity">
              <div className="identity-icon">
                <UserRoundPlus size={22} />
              </div>
              <div>
                <h3>{selected.company}</h3>
                <p>{selected.person || "担当者未設定"}</p>
                <a href={`mailto:${selected.email}`}>
                  <Mail size={13} />
                  {selected.email}
                </a>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <span>ステータス</span>
                <LeadStatus status={selected.status} />
              </div>
              <div>
                <span>タッチ回数</span>
                <strong>{selected.touches} 回</strong>
              </div>
              <div>
                <span>最終接触</span>
                <strong>{selected.lastTouch ? timeAgo(selected.lastTouch) : "未接触"}</strong>
              </div>
              <div>
                <span>登録日</span>
                <strong>{new Date(selected.createdAt).toLocaleDateString("ja-JP")}</strong>
              </div>
            </div>
            {selected.notes ? (
              <div className="timeline-mini">
                <h4>メモ</h4>
                <p>{selected.notes}</p>
              </div>
            ) : null}
            <div className="timeline-mini">
              <h4>最近の履歴</h4>
              <p>
                <i />
                {selected.lastTouch ? `${timeAgo(selected.lastTouch)} · ${selected.nextAction}` : "未接触 · 初回営業"}
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setSelected(null)}>
              閉じる
            </button>
            <button className="btn primary" onClick={() => alert("タスク作成はタスクページから行えます")}>
              タスクを作成
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="mini-metric">
      <i className={tone} />
      <span>
        {label}
        <small>{sub}</small>
      </span>
      <strong>{value}</strong>
    </div>
  );
}
function LeadStatus({ status }: { status: LeadRow["status"] }) {
  const key = status === "アクティブ" ? "approved" : status === "返信あり" ? "claimed" : status === "抑制中" ? "rejected" : "archived";
  return <span className={`status-pill ${key}`}>{status}</span>;
}
function AddLeadModal({
  onClose,
  onAdd,
  pending,
}: {
  onClose: () => void;
  onAdd: (company: string, person: string, email: string) => void;
  pending: boolean;
}) {
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Modal title="リードを追加" onClose={onClose}>
      <div className="modal-body form-grid">
        <label>
          会社名
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="株式会社Example" />
        </label>
        <label>
          担当者
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="山田 太郎" />
        </label>
        <label className="full">
          メールアドレス
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@example.jp" type="email" />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={pending}>
          キャンセル
        </button>
        <button className="btn primary" disabled={!company || !email || pending} onClick={() => onAdd(company, person, email)}>
          {pending ? "追加中..." : "追加する"}
        </button>
      </div>
    </Modal>
  );
}
