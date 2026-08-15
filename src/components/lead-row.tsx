"use client";

import { useTransition } from "react";
import { updateLeadStatus, deleteLead } from "@/lib/actions";
import { Badge, LEAD_STATUS_COLOR, LEAD_STATUS_LABEL } from "./status-badge";

export function LeadRow({
  lead,
}: {
  lead: {
    id: string;
    company: string;
    contactName: string | null;
    email: string;
    status: string;
    touchCount: number;
    lastTouchAt: string | null;
  };
}) {
  const [isPending, startTransition] = useTransition();

  const changeStatus = (status: string) => {
    startTransition(async () => {
      await updateLeadStatus(lead.id, status as never);
    });
  };

  const remove = () => {
    if (!confirm(`「${lead.company}」を削除しますか？`)) return;
    startTransition(async () => {
      await deleteLead(lead.id);
    });
  };

  return (
    <tr className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
      <td className="px-4 py-3">
        <p className="font-medium">{lead.company}</p>
        {lead.contactName && <p className="text-xs text-zinc-500">{lead.contactName}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-400">{lead.email}</td>
      <td className="px-4 py-3">
        <Badge color={LEAD_STATUS_COLOR[lead.status] ?? "zinc"}>
          {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-400">{lead.touchCount}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {lead.lastTouchAt ? new Date(lead.lastTouchAt).toLocaleString("ja-JP") : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={isPending}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
          >
            {Object.entries(LEAD_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={remove}
            className="text-xs text-zinc-600 transition hover:text-red-400"
            title="削除"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}
