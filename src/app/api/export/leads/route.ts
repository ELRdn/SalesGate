import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(){
  const leads = await prisma.lead.findMany({ orderBy:{createdAt:"desc"} });
  const header = "company,contactName,email,status,touchCount,lastTouchAt\n";
  const esc = (s:string)=> s.replace(/"/g, `""`);
  const rows = leads.map((l)=>`"${esc(l.company)}","${esc(l.contactName??"")}","${esc(l.email)}","${l.status}",${l.touchCount},"${l.lastTouchAt?.toISOString()??""}"`).join("\n");
  const csv = "\uFEFF" + header + rows;
  return new Response(csv, { headers:{ "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":"attachment; filename=\"leads.csv\"" }});
}
