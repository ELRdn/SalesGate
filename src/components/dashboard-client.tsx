"use client";

import { CheckCircle2 } from "lucide-react";
import { useTransition } from "react";
import { EmptyState, AgentChip } from "@/components/ui";
import { approveApprovalItem, rejectApprovalItem } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { riskClass } from "@/components/ui";

type DashboardApproval = {
  id: string;
  company: string;
  person: string;
  email: string;
  agent: string;
  subject: string;
  note: string;
  evidence: string;
  risk: "低リスク" | "中リスク" | "高リスク";
  time: string;
  status: "承認待ち";
};

function riskKey(risk: DashboardApproval["risk"]): string {
  if (risk === "高リスク") return "status.risk.high";
  if (risk === "中リスク") return "status.risk.medium";
  return "status.risk.low";
}

export function DashboardApprovals({ items }: { items: DashboardApproval[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveApprovalItem(id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("errors.approveFailed"));
      }
    });
  };

  const handleReject = (id: string) => {
    const feedback = prompt(t("approvals.feedbackLabel"));
    if (feedback === null) return;
    startTransition(async () => {
      try {
        await rejectApprovalItem(id, feedback);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("errors.rejectFailed"));
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="approval-list">
        <EmptyState icon={<CheckCircle2 size={30} />} title={t("dashboard.noPending")} text={t("dashboard.noPendingDesc")} />
      </div>
    );
  }

  return (
    <div className="approval-list">
      {items.map((item) => (
        <div className="approval-row" key={item.id}>
          <div className="lead-cell">
            <strong>{item.company}</strong>
            <span>{item.person}</span>
            <small>{item.email}</small>
          </div>
          <div>
            <AgentChip agent={item.agent as "DSH" | "OpenClaw" | "Claude Code" | "Codex"} />
          </div>
          <div className="subject-cell">
            <strong>{item.subject}</strong>
            <span>{item.note}</span>
          </div>
          <div>
            <span className={riskClass[item.risk]}>{t(riskKey(item.risk))}</span>
          </div>
          <div className="actions-cell">
            <span className="row-time">{item.time}</span>
            <div>
              <button className="approve" onClick={() => handleApprove(item.id)} disabled={isPending}>
                {t("approvals.approve")}
              </button>
              <button className="edit" onClick={() => router.push("/approvals")}>
                {t("common.edit")}
              </button>
              <button className="reject" onClick={() => handleReject(item.id)} disabled={isPending}>
                {t("approvals.reject")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
