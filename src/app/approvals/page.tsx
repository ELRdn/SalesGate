"use client";

import { Check, CheckCircle2, ChevronRight, FileSearch, LockKeyhole, Search, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { initialApprovals } from "@/data/mock";
import { AgentChip, EmptyState, Modal, PageHeader, Panel, RiskChip } from "@/components/ui";
import type { Approval, ApprovalStatus } from "@/types";

const filters: Array<"全件" | ApprovalStatus> = ["承認待ち", "承認済み", "編集承認済み", "送信失敗", "却下", "送信済み", "全件"];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);
  const [filter, setFilter] = useState<"全件" | ApprovalStatus>("承認待ち");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(approvals.find((a) => a.status === "承認待ち")?.id ?? approvals[0]?.id ?? null);
  const [mode, setMode] = useState<"edit" | "reject" | null>(null);
  const selected = approvals.find((a) => a.id === selectedId) ?? null;

  const rows = useMemo(
    () => approvals.filter((a) => (filter === "全件" || a.status === filter) && `${a.company} ${a.person} ${a.email} ${a.subject}`.toLowerCase().includes(query.toLowerCase())),
    [approvals, filter, query],
  );

  const updateApproval = (id: number, patch: Partial<Approval>) => {
    setApprovals((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const approve = (item: Approval) => {
    updateApproval(item.id, { status: "承認済み" });
  };

  return (
    <div className="workspace-page approvals-page">
      <PageHeader
        title="承認キュー"
        description="AIエージェントが提出した外部送信を、人間が最終判断します。"
        action={
          <div className="queue-kpi">
            <span>承認待ち</span>
            <strong>{approvals.filter((a) => a.status === "承認待ち").length}</strong>
          </div>
        }
      />
      <div className="filter-toolbar">
        <div className="filter-tabs">
          {filters.map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
              {item === "承認待ち" ? <b>{approvals.filter((a) => a.status === "承認待ち").length}</b> : null}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="企業・担当者・件名を検索" />
        </label>
      </div>

      <div className="master-detail">
        <Panel className="queue-list-panel">
          <div className="queue-list-head">
            <span>{rows.length} 件</span>
            <small>新しい順</small>
          </div>
          <div className="queue-list">
            {rows.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={30} />} title="該当する承認はありません" text="フィルタまたは検索条件を変更してください。" />
            ) : (
              rows.map((item) => (
                <button key={item.id} className={`queue-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                  <div className="queue-item-top">
                    <strong>{item.company}</strong>
                    <StatusPill status={item.status} />
                  </div>
                  <span>{item.subject}</span>
                  <small>{item.person} · {item.agent} · {item.time}</small>
                  <div className="queue-item-foot">
                    <RiskChip risk={item.risk} />
                    <ChevronRight size={15} />
                  </div>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel className="approval-detail-panel">
          {!selected ? (
            <EmptyState icon={<FileSearch size={30} />} title="承認を選択してください" text="左側のキューからレビュー対象を選びます。" />
          ) : (
            <>
              <div className="approval-detail-head">
                <div>
                  <div className="eyebrow">{selected.company}</div>
                  <h2>{selected.subject}</h2>
                  <p>{selected.person} &lt;{selected.email}&gt;</p>
                </div>
                <div className="detail-meta">
                  <StatusPill status={selected.status} />
                  <AgentChip agent={selected.agent} />
                </div>
              </div>
              <div className="risk-evidence-grid">
                <div className="detail-box risk-box">
                  <div className="detail-label"><ShieldAlert size={15} />リスク評価</div>
                  <div className="risk-box-content">
                    <RiskChip risk={selected.risk} />
                    <span>{selected.note}</span>
                  </div>
                </div>
                <div className="detail-box evidence-box">
                  <div className="detail-label"><FileSearch size={15} />根拠</div>
                  <p>{selected.evidence}</p>
                </div>
              </div>
              <div className="mail-preview">
                <div className="mail-field"><span>件名</span><strong>{selected.subject}</strong></div>
                <div className="mail-body">{selected.body}</div>
              </div>
              <div className="hash-strip">
                <LockKeyhole size={14} />
                <span>承認時に本文 SHA-256 をロック</span>
                <code>8fc2...a91d</code>
                <b>一致予定</b>
              </div>
              <div className="decision-footer">
                <div>
                  <small>提出元</small>
                  <strong>{selected.agent} · {selected.time}</strong>
                </div>
                {selected.status === "承認待ち" ? (
                  <div className="decision-buttons">
                    <button className="btn secondary" onClick={() => setMode("edit")}>編集して承認</button>
                    <button className="btn ghost-danger" onClick={() => setMode("reject")}>却下</button>
                    <button className="btn primary" onClick={() => approve(selected)}><Check size={15} />承認</button>
                  </div>
                ) : selected.status === "送信失敗" ? (
                  <button className="btn warning" onClick={() => updateApproval(selected.id, { status: "承認済み" })}>再送信を許可</button>
                ) : (
                  <div className="decision-done"><CheckCircle2 size={17} />このアイテムは処理済みです</div>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>

      {mode && selected ? (
        <ApprovalModal
          mode={mode}
          item={selected}
          onClose={() => setMode(null)}
          onSave={(patch) => { updateApproval(selected.id, patch); setMode(null); }}
        />
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: ApprovalStatus }) {
  const key = status === "承認待ち" ? "awaiting" : status === "承認済み" ? "approved" : status === "編集承認済み" ? "edited" : status === "却下" ? "rejected" : status === "送信失敗" ? "failed" : "sent";
  return <span className={`status-pill ${key}`}>{status}</span>;
}

function ApprovalModal({ mode, item, onClose, onSave }: { mode: "edit" | "reject"; item: Approval; onClose: () => void; onSave: (patch: Partial<Approval>) => void }) {
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.body);
  const [reason, setReason] = useState("");
  return (
    <Modal title={mode === "edit" ? "編集して承認" : "承認を却下"} onClose={onClose} width="720px">
      <div className="modal-body form-stack">
        {mode === "edit" ? (
          <>
            <label>件名<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
            <label>本文<textarea rows={11} value={body} onChange={(e) => setBody(e.target.value)} /></label>
            <div className="modal-info">保存と同時に新しい本文ハッシュを生成し、編集承認済みに変更します。</div>
          </>
        ) : (
          <>
            <div className="reject-warning">
              <ShieldAlert size={18} />
              <span><strong>{item.company}</strong> の下書きを却下します。エージェントはこの結果を次の判断に利用できます。</span>
            </div>
            <label>フィードバック（任意）<textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例: 根拠のない実績表現を削除して再提出してください" /></label>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}><X size={15} />キャンセル</button>
        <button
          className={mode === "edit" ? "btn primary" : "btn destructive"}
          onClick={() => onSave(mode === "edit" ? { subject, body, status: "編集承認済み" } : { status: "却下", note: reason || item.note })}
        >
          {mode === "edit" ? "編集して承認" : "却下する"}
        </button>
      </div>
    </Modal>
  );
}
