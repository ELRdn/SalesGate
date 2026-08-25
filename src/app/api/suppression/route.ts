import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function POST(req: Request){
  try{
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const reason = (body.reason ?? "").trim() || "手動抑制";
    if(!email || !email.includes("@")) return Response.json({ error:"メールアドレスが不正です" },{status:400});
    const existing = await prisma.lead.findUnique({ where:{email} });
    if(existing){
      const updated = await prisma.lead.update({ where:{email}, data:{ status:"SUPPRESSED", notes: reason }});
      return Response.json({ ok:true, id: updated.id });
    }else{
      const created = await prisma.lead.create({ data:{ company: email.split("@")[0], email, status:"SUPPRESSED", notes: reason }});
      return Response.json({ ok:true, id: created.id });
    }
  }catch(e){
    return Response.json({ error: e instanceof Error? e.message:"不明なエラー" },{status:500});
  }
}
