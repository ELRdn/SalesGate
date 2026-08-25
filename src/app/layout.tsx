import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { VERSION } from "@/lib/version";
import { getLocale } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";

export const metadata: Metadata = {
  title: "SalesGate — Approval-first AI SDR Hub",
  description: "何も勝手に送らない。営業はAIに、判断はあなたに。",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let pendingCount = 0;
  try {
    pendingCount = await prisma.approvalItem.count({ where: { status: "AWAITING_APPROVAL" } });
  } catch {
    pendingCount = 0;
  }

  // agents derivation: distinct submittedBy / assignedTo
  let agents: string[] = [];
  try {
    const [fromApprovals, fromTasks] = await Promise.all([
      prisma.approvalItem.findMany({ distinct: ["submittedBy"], select: { submittedBy: true }, where: { submittedBy: { not: null } }, take: 10 }),
      prisma.task.findMany({ distinct: ["assignedTo"], select: { assignedTo: true }, where: { assignedTo: { not: null } }, take: 10 }),
    ]);
    const set = new Set<string>();
    for (const r of fromApprovals) if (r.submittedBy) set.add(r.submittedBy);
    for (const r of fromTasks) if (r.assignedTo) set.add(r.assignedTo);
    agents = Array.from(set).slice(0, 8);
  } catch {
    agents = [];
  }

  const locale = await getLocale().catch(() => "en" as const);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <Shell pendingCount={pendingCount} version={VERSION} agents={agents}>
            {children}
          </Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
