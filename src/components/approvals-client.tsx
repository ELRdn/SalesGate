"use client";

import { Check, CheckCircle2, ChevronRight, FileSearch, LockKeyhole, Search, ShieldAlert, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentChip, EmptyState, Modal, PageHeader, Panel, RiskChip } from "@/components/ui";
import { approveApprovalItem, editAndApproveApprovalItem, rejectApprovalItem, retryFailedApprovalItem } from "@/lib/actions";
import { timeAgo } from "@/lib/serialize";
import { useI18n } from "@/i18n/provider";

type ApprovalItem = {
  id: string;
  company: string;
  person: string;
  email: string;
  agent: string;
  subject: string;
  body: string;
  rawBody: string;
  editedBody: string | null;
  note: string;
  evidence: string;
  risk: "低リスク" | "中リスク" | "高リスク";
  riskFlags: string[];
  time: string;
  status: "承認待ち" | "承認済み" | "編集承認済み" | "却下" | "送信失敗" | "送信済み" | "送信中" | "アーカイブ";
  dbStatus: string;
  lockedHash: string | null;
  hashMismatchAt: string | null;
  feedback: string | null;
  claimedBy: string | null;
  messageId: string | null;
};

const filterDefs: Array<{ value: "全件" | ApprovalItem["status"]; key: string }> = [
  { value: "承認待ち", key: "awaiting" },
  { value: "承認済み", key: "approved" },
  { value: "編集承認済み", key: "edited" },
  { value: "送信失敗", key: "failed" },
  { value: "却下", key: "rejected" },
  { value: "送信済み", key: "sent" },
  { value: "全件", key: "all" },
];

export function ApprovalsClient({ initialItems }: { initialItems: ApprovalItem[] }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"全件" | ApprovalItem["status"]>("承認待ち");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialItems.find((a) => a.status === "承認待ち")?.id ?? initialItems[0]?.id ?? null);
  const [mode, setMode] = useState<"edit" | "reject" | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () => initialItems.filter((a) => (filter === "全件" || a.status === filter) && `${a.company} ${a.person} ${a.email} ${a.subject}`.toLowerCase().includes(query.toLowerCase())),
    [initialItems, filter, query],
  );

  const selected = initialItems.find((a) => a.id === selectedId) ?? null;
  const pendingCount = initialItems.filter((a) => a.status === "承認待ち").length;

  const handleApprove = (item: ApprovalItem) => {
    startTransition(async () => {
      try {
        await approveApprovalItem(item.id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("approvals.approveError"));
      }
    });
  };

  const handleRetry = (item: ApprovalItem) => {
    startTransition(async () => {
      try {
        await retryFailedApprovalItem(item.id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("approvals.approveError"));
      }
    });
  };

  return (
    <div className="workspace-page approvals-page">
      <PageHeader
        title={t("approvals.title")}
        description={t("approvals.description")}
        action={
          <div className="queue-kpi">
            <span>{t("approvals.pending")}</span>
            <strong>{pendingCount}</strong>
          </div>
        }
      />
      <div className="filter-toolbar">
        <div className="filter-tabs">
          {filterDefs.map((item) => (
            <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>
              {t(`approvals.filters.${item.key}`)}
              {item.key === "awaiting" ? <b>{pendingCount}</b> : null}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("approvals.searchPlaceholder")} />
        </label>
      </div>

      <div className="master-detail">
        <Panel className="queue-list-panel">
          <div className="queue-list-head">
            <span>{t("approvals.count", { count: rows.length })}</span>
            <small>{t("approvals.newestFirst")}</small>
          </div>
          <div className="queue-list">
            {rows.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={30} />} title={t("approvals.noMatching")} text={t("approvals.noMatchingDesc")} />
            ) : (
              rows.map((item) => (
                <button key={item.id} className={`queue-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                  <div className="queue-item-top">
                    <strong>{item.company}</strong>
                    <StatusPill dbStatus={item.dbStatus} />
                  </div>
                  <span>{item.subject}</span>
                  <small>
                    {item.person} · {item.agent} · {timeAgo(item.time)}
                  </small>
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
            <EmptyState icon={<FileSearch size={30} />} title={t("approvals.selectPrompt")} text={t("approvals.selectDesc")} />
          ) : (
            <>
              <div className="approval-detail-head">
                <div>
                  <div className="eyebrow">{selected.company}</div>
                  <h2>{selected.subject}</h2>
                  <p>
                    {selected.person} &lt;{selected.email}&gt;
                  </p>
                </div>
                <div className="detail-meta">
                  <StatusPill dbStatus={selected.dbStatus} />
                  <AgentChip agent={selected.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} />
                </div>
              </div>
              <div className="risk-evidence-grid">
                <div className="detail-box risk-box">
                  <div className="detail-label">
                    <ShieldAlert size={15} />
                    {t("approvals.risk")}
                  </div>
                  <div className="risk-box-content">
                    <RiskChip risk={selected.risk} />
                    <span>{selected.feedback ?? selected.note ?? (selected.riskFlags.length ? selected.riskFlags.join(", ") : t("approvals.noRiskFlags"))}</span>
                  </div>
                </div>
                <div className="detail-box evidence-box">
                  <div className="detail-label">
                    <FileSearch size={15} />
                    {t("approvals.evidence")}
                  </div>
                  <p>{selected.evidence || t("approvals.noEvidence")}</p>
                </div>
              </div>
              <div className="mail-preview">
                <div className="mail-field">
                  <span>{t("approvals.subject")}</span>
                  <strong>{selected.subject}</strong>
                </div>
                <div className="mail-body">{selected.body}</div>
              </div>
              <div className="hash-strip">
                <LockKeyhole size={14} />
                <span>{t("approvals.hashLocked")}</span>
                {selected.lockedHash ? (
                  <>
                    <code>
                      {selected.lockedHash.slice(0, 6)}...{selected.lockedHash.slice(-4)}
                    </code>
                    {selected.hashMismatchAt ? <b style={{ color: "#ff6b73" }}>{t("approvals.hashMismatch")}</b> : <b>{t("approvals.hashMatch")}</b>}
                  </>
                ) : (
                  <>
                    <code>—</code>
                    <b>{t("approvals.hashNotLocked")}</b>
                  </>
                )}
              </div>
              {selected.hashMismatchAt ? <div className="hash-mismatch-warning">{t("approvals.hashMismatchWarning", { time: timeAgo(selected.hashMismatchAt) })}</div> : null}
              <div className="decision-footer">
                <div>
                  <small>{t("approvals.submittedBy")}</small>
                  <strong>
                    {selected.agent} · {timeAgo(selected.time)}
                    {selected.claimedBy ? ` · ${t("approvals.claimedBy")}: ${selected.claimedBy}` : ""}
                  </strong>
                </div>
                {selected.status === "承認待ち" ? (
                  <div className="decision-buttons">
                    <button className="btn secondary" onClick={() => setMode("edit")} disabled={isPending}>
                      {t("approvals.editAndApprove")}
                    </button>
                    <button className="btn ghost-danger" onClick={() => setMode("reject")} disabled={isPending}>
                      {t("approvals.reject")}
                    </button>
                    <button className="btn primary" onClick={() => handleApprove(selected)} disabled={isPending}>
                      <Check size={15} />
                      {t("approvals.approve")}
                    </button>
                  </div>
                ) : selected.status === "送信失敗" ? (
                  <button className="btn warning" onClick={() => handleRetry(selected)} disabled={isPending}>
                    {t("approvals.retry")}
                  </button>
                ) : (
                  <div className="decision-done">
                    <CheckCircle2 size={17} />
                    {t("approvals.processed")} ({t(`status.approval.${selected.dbStatus}`)}
                    {selected.messageId ? ` · ${selected.messageId}` : ""})
                  </div>
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
          onSuccess={() => {
            setMode(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function StatusPill({ dbStatus }: { dbStatus: string }) {
  const { t } = useI18n();
  const keyMap: Record<string, string> = {
    AWAITING_APPROVAL: "awaiting",
    APPROVED: "approved",
    EDITED: "edited",
    REJECTED: "rejected",
    FAILED: "failed",
    CLAIMED: "claimed",
    SENT: "sent",
    ARCHIVED: "archived",
  };
  const key = keyMap[dbStatus] ?? "awaiting";
  return <span className={`status-pill ${key}`}>{t(`status.approval.${dbStatus}`)}</span>;
}

function ApprovalModal({
  mode,
  item,
  onClose,
  onSuccess,
}: {
  mode: "edit" | "reject";
  item: ApprovalItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.rawBody);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (mode === "edit") {
          if (!subject.trim() || !body.trim()) {
            alert(t("errors.required"));
            return;
          }
          await editAndApproveApprovalItem(item.id, subject, body);
        } else {
          await rejectApprovalItem(item.id, reason);
        }
        onSuccess();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("errors.generic"));
      }
    });
  };

  return (
    <Modal title={mode === "edit" ? t("approvals.editModalTitle") : t("approvals.rejectModalTitle")} onClose={onClose} width="720px">
      <div className="modal-body form-stack">
        {mode === "edit" ? (
          <>
            <label>
              {t("approvals.subject")}
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label>
              {t("approvals.mailPreview")}
              <textarea rows={11} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <div className="modal-info">{t("approvals.editInfo")}</div>
          </>
        ) : (
          <>
            <div className="reject-warning">
              <ShieldAlert size={18} />
              <span>
                <strong>{item.company}</strong> {t("approvals.rejectWarning")}
              </span>
            </div>
            <label>
              {t("approvals.feedbackLabel")}
              <textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("approvals.feedbackPlaceholder")} />
            </label>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={isPending}>
          <X size={15} />
          {t("common.cancel")}
        </button>
        <button className={mode === "edit" ? "btn primary" : "btn destructive"} onClick={handleSave} disabled={isPending}>
          {isPending ? t("common.saving") : mode === "edit" ? t("approvals.editAndApprove") : t("approvals.reject")}
        </button>
      </div>
    </Modal>
  );
}
