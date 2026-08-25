import { prisma } from "@/lib/prisma";
import { SuppressionClient } from "@/components/suppression-client";
export const dynamic = "force-dynamic";
export default async function SuppressionPage(){
  const leads = await prisma.lead.findMany({ where:{status:"SUPPRESSED"}, orderBy:{updatedAt:"desc"}, take:500 });
  const serialized = leads.map((l)=>({ id:l.id, email:l.email, reason:l.notes ?? "手動抑制", source:"管理画面", added: new Date(l.updatedAt).toLocaleDateString("ja-JP"), owner:"System" }));
  return <SuppressionClient initialEntries={serialized} />;
}
