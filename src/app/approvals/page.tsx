import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ApprovalCard } from "@/components/approval-card";
import { serializeApprovalItem } from "@/lib/serialize";
import type { ApprovalStatus } from "@/lib/approval-machine";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses?: ApprovalStatus[] }[] = [
  { key: "pending", label: "🟡 承認待ち", statuses: ["AWAITING_APPROVAL"] },
  { key: "approved", label: "🟢 承認済み", statuses: ["APPROVED", "EDITED", "CLAIMED"] },
  { key: "failed", label: "🔴 失敗", statuses: ["FAILED"] },
  { key: "rejected", label: "⛔ 却下", statuses: ["REJECTED"] },
  { key: "sent", label: "📤 送信済み", statuses: ["SENT"] },
  { key: "archived", label: "🗄 アーカイブ", statuses: ["ARCHIVED"] },
  { key: "all", label: "全件" },
];

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const items = await prisma.approvalItem.findMany({
    where: active.statuses ? { status: { in: active.statuses } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { lead: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">承認キュー</h1>
          <p className="mt-1 text-sm text-zinc-500">
            すべての外部送信はここでの承認を通過します。何も勝手に送られません。
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "pending" ? "/approvals" : `/approvals?filter=${f.key}`}
              className={`rounded-md px-3 py-1.5 transition ${
                active.key === f.key
                  ? "bg-emerald-600 font-medium text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
          {active.key === "pending"
            ? "承認待ちはありません。エージェントが下書きを提出するとここに表示されます。"
            : "この状態のアイテムはありません。"}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApprovalCard key={item.id} item={serializeApprovalItem(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
