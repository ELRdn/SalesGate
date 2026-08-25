import { prisma } from "@/lib/prisma";
import { PlaybooksClient } from "@/components/playbooks-client";
export const dynamic = "force-dynamic";
export default async function PlaybooksPage(){
  const playbooks = await prisma.playbook.findMany({ orderBy:{updatedAt:"desc"}, take:100 });
  const serialized = playbooks.map((p)=>({ id:p.id, name:p.name, description:p.description??"", version:p.version, content:p.content, source:p.source??"", updated:new Date(p.updatedAt).toLocaleDateString("ja-JP"), createdAt:p.createdAt.toISOString() }));
  return <PlaybooksClient initialPlaybooks={serialized} />;
}
