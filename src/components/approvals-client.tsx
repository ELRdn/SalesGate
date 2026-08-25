"use client";

import { Check, CheckCircle2, ChevronRight, FileSearch, LockKeyhole, Search, ShieldAlert, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentChip, EmptyState, Modal, PageHeader, Panel, RiskChip } from "@/components/ui";
import { approveApprovalItem, editAndApproveApprovalItem, rejectApprovalItem, retryFailedApprovalItem } from "@/lib/actions";
import { timeAgo } from "@/lib/serialize";

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

const filters: Array<"全件" | ApprovalItem["status"]> = ["承認待ち", "承認済み", "編集承認済み", "送信失敗", "却下", "送信済み", "全件"];

export function ApprovalsClient({ initialItems }: { initialItems: ApprovalItem[] }) {
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
        alert(e instanceof Error ? e.message : "承認に失敗しました");
      }
    });
  };

  const handleRetry = (item: ApprovalItem) => {
    startTransition(async () => {
      try {
        await retryFailedApprovalItem(item.id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "再送信許可に失敗しました");
      }
    });
  };

  return (
    <div className="workspace-page approvals-page">
      <PageHeader
        title="承認キュー"
        description="AIエージェントが提出した外部送信を、人間が最終判断します。"
        action={
          <div className="queue-kpi">
            <span>承認待ち</span>
            <strong>{pendingCount}</strong>
          </div>
        }
      />
      <div className="filter-toolbar">
        <div className="filter-tabs">
          {filters.map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
              {item === "承認待ち" ? <b>{pendingCount}</b> : null}
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
            <EmptyState icon={<FileSearch size={30} />} title="承認を選択してください" text="左側のキューからレビュー対象を選びます。" />
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
                  <StatusPill status={selected.status} />
                  <AgentChip agent={selected.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} />
                </div>
              </div>
              <div className="risk-evidence-grid">
                <div className="detail-box risk-box">
                  <div className="detail-label">
                    <ShieldAlert size={15} />
                    リスク評価
                  </div>
                  <div className="risk-box-content">
                    <RiskChip risk={selected.risk} />
                    <span>{selected.feedback ?? selected.note ?? (selected.riskFlags.length ? selected.riskFlags.join(", ") : "リスクフラグなし")}</span>
                  </div>
                </div>
                <div className="detail-box evidence-box">
                  <div className="detail-label">
                    <FileSearch size={15} />
                    根拠
                  </div>
                  <p>{selected.evidence || "根拠は提出されていません"}</p>
                </div>
              </div>
              <div className="mail-preview">
                <div className="mail-field">
                  <span>件名</span>
                  <strong>{selected.subject}</strong>
                </div>
                <div className="mail-body">{selected.body}</div>
              </div>
              <div className="hash-strip">
                <LockKeyhole size={14} />
                <span>承認時に本文 SHA-256 をロック</span>
                {selected.lockedHash ? (
                  <>
                    <code>
                      {selected.lockedHash.slice(0, 6)}...{selected.lockedHash.slice(-4)}
                    </code>
                    {selected.hashMismatchAt ? <b style={{ color: "#ff6b73" }}>不一致</b> : <b>一致</b>}
                  </>
                ) : (
                  <>
                    <code>—</code>
                    <b>未ロック</b>
                  </>
                )}
              </div>
              {selected.hashMismatchAt ? <div className="hash-mismatch-warning">⚠ ハッシュ不一致が検知されました（{timeAgo(selected.hashMismatchAt)}）</div> : null}
              <div className="decision-footer">
                <div>
                  <small>提出元</small>
                  <strong>
                    {selected.agent} · {timeAgo(selected.time)}
                    {selected.claimedBy ? ` · claim: ${selected.claimedBy}` : ""}
                  </strong>
                </div>
                {selected.status === "承認待ち" ? (
                  <div className="decision-buttons">
                    <button className="btn secondary" onClick={() => setMode("edit")} disabled={isPending}>
                      編集して承認
                    </button>
                    <button className="btn ghost-danger" onClick={() => setMode("reject")} disabled={isPending}>
                      却下
                    </button>
                    <button className="btn primary" onClick={() => handleApprove(selected)} disabled={isPending}>
                      <Check size={15} />
                      承認
                    </button>
                  </div>
                ) : selected.status === "送信失敗" ? (
                  <button className="btn warning" onClick={() => handleRetry(selected)} disabled={isPending}>
                    再送信を許可
                  </button>
                ) : (
                  <div className="decision-done">
                    <CheckCircle2 size={17} />
                    このアイテムは処理済みです ({selected.status}
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

function StatusPill({ status }: { status: ApprovalItem["status"] }) {
  const key =
    status === "承認待ち"
      ? "awaiting"
      : status === "承認済み"
        ? "approved"
        : status === "編集承認済み"
          ? "edited"
          : status === "却下"
            ? "rejected"
            : status === "送信失敗"
              ? "failed"
              : status === "送信中"
                ? "claimed"
                : "sent";
  return <span className={`status-pill ${key}`}>{status}</span>;
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
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.rawBody);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (mode === "edit") {
          if (!subject.trim() || !body.trim()) {
            alert("件名と本文は必須です");
            return;
          }
          await editAndApproveApprovalItem(item.id, subject, body);
        } else {
          await rejectApprovalItem(item.id, reason);
        }
        onSuccess();
      } catch (e) {
        alert(e instanceof Error ? e.message : "操作に失敗しました");
      }
    });
  };

  return (
    <Modal title={mode === "edit" ? "編集して承認" : "承認を却下"} onClose={onClose} width="720px">
      <div className="modal-body form-stack">
        {mode === "edit" ? (
          <>
            <label>
              件名
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label>
              本文
              <textarea rows={11} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <div className="modal-info">保存と同時に新しい本文ハッシュを生成し、編集承認済みに変更します。</div>
          </>
        ) : (
          <>
            <div className="reject-warning">
              <ShieldAlert size={18} />
              <span>
                <strong>{item.company}</strong> の下書きを却下します。エージェントはこの結果を次の判断に利用できます。
              </span>
            </div>
            <label>
              フィードバック（任意）
              <textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例: 根拠のない実績表現を削除して再提出してください" />
            </label>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={isPending}>
          <X size={15} />
          キャンセル
        </button>
        <button className={mode === "edit" ? "btn primary" : "btn destructive"} onClick={handleSave} disabled={isPending}>
          {isPending ? "処理中..." : mode === "edit" ? "編集して承認" : "却下する"}
        </button>
      </div>
    </Modal>
  );
}
