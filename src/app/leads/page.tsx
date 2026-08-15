import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/lead-form";
import { LeadRow } from "@/components/lead-row";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">リード管理</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ミニCRM。重複はメールアドレスで自動チェックされます。
        </p>
      </div>

      <LeadForm />

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">リード一覧（{leads.length}件）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-2 font-medium">会社 / 担当者</th>
                <th className="px-4 py-2 font-medium">メール</th>
                <th className="px-4 py-2 font-medium">ステータス</th>
                <th className="px-4 py-2 font-medium">タッチ</th>
                <th className="px-4 py-2 font-medium">最終タッチ</th>
                <th className="px-4 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={{
                    id: lead.id,
                    company: lead.company,
                    contactName: lead.contactName,
                    email: lead.email,
                    status: lead.status,
                    touchCount: lead.touchCount,
                    lastTouchAt: lead.lastTouchAt?.toISOString() ?? null,
                  }}
                />
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    リードがまだありません。上のフォームかCSVで追加してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
