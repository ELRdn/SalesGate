"use client";

import { CheckCircle2 } from "lucide-react";
import { useTransition } from "react";
import { AgentChip, RiskChip, EmptyState } from "@/components/ui";
import { approveApprovalItem, rejectApprovalItem } from "@/lib/actions";
import { useRouter } from "next/navigation";

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

export function DashboardApprovals({ items }: { items: DashboardApproval[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveApprovalItem(id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "承認に失敗しました");
      }
    });
  };

  const handleReject = (id: string) => {
    const feedback = prompt("却下理由を入力してください（任意）");
    if (feedback === null) return;
    startTransition(async () => {
      try {
        await rejectApprovalItem(id, feedback);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "却下に失敗しました");
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="approval-list">
        <EmptyState icon={<CheckCircle2 size={30} />} title="承認待ちはありません" text="エージェントが新しい下書きを提出するとここに表示されます。" />
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
            <RiskChip risk={item.risk} />
          </div>
          <div className="actions-cell">
            <span className="row-time">{item.time}</span>
            <div>
              <button className="approve" onClick={() => handleApprove(item.id)} disabled={isPending}>
                承認
              </button>
              <button className="edit" onClick={() => router.push("/approvals")}>
                編集
              </button>
              <button className="reject" onClick={() => handleReject(item.id)} disabled={isPending}>
                却下
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
