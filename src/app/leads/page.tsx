import { prisma } from "@/lib/prisma";
import { LeadsClient } from "@/components/leads-client";

export const dynamic = "force-dynamic";

function mapLeadStatus(s: string): "アクティブ" | "返信あり" | "休眠" | "抑制中" {
  switch (s) {
    case "ACTIVE":
      return "アクティブ";
    case "RESPONDED":
      return "返信あり";
    case "SLEEPING":
      return "休眠";
    case "SUPPRESSED":
      return "抑制中";
    default:
      return "アクティブ";
  }
}

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 500 });

  const serialized = leads.map((l) => ({
    id: l.id,
    company: l.company,
    person: l.contactName ?? "",
    email: l.email,
    status: mapLeadStatus(l.status),
    dbStatus: l.status,
    touches: l.touchCount,
    lastTouch: l.lastTouchAt ? l.lastTouchAt.toISOString() : "",
    lastTouchLabel: l.lastTouchAt ? new Date(l.lastTouchAt).toLocaleDateString("ja-JP") : "未接触",
    nextAction: l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toLocaleDateString("ja-JP") : l.status === "SUPPRESSED" ? "送信禁止" : l.status === "SLEEPING" ? "休眠" : "—",
    notes: l.notes ?? "",
    createdAt: l.createdAt.toISOString(),
  }));

  return <LeadsClient initialLeads={serialized} />;
}
