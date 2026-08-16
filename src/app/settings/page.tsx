import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";
import { PlaybookSection } from "@/components/playbook-section";
import { Badge, LEAD_STATUS_COLOR, LEAD_STATUS_LABEL } from "@/components/status-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, suppressed, playbooks] = await Promise.all([
    prisma.setting.findMany(),
    prisma.lead.findMany({
      where: { status: "SUPPRESSED" },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.playbook.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const initial: Record<string, string> = {};
  for (const s of settings) initial[s.key] = s.value;

  const playbookItems = playbooks.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    version: p.version,
    source: p.source,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-zinc-500">
          フォローアップルール・送信上限・抑制リストの管理。
        </p>
      </div>

      <SettingsForm initial={initial} />

      <PlaybookSection playbooks={playbookItems} />

      {/* 抑制リスト */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">🚫 抑制リスト（オプトアウト）</h2>
          <span className="text-xs text-zinc-500">
            SUPPRESSED のリードには送信提案がブロックされます
          </span>
        </div>
        {suppressed.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">抑制中のリードはありません</p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {suppressed.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{lead.company}</p>
                  <p className="text-xs text-zinc-500">{lead.email}</p>
                </div>
                <Badge color={LEAD_STATUS_COLOR[lead.status] ?? "zinc"}>
                  {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-zinc-800 px-4 py-3 text-right">
          <Link href="/leads" className="text-sm text-emerald-400 hover:underline">
            リード一覧からステータスを変更 →
          </Link>
        </div>
      </div>
    </div>
  );
}
