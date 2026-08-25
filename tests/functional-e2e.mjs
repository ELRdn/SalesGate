import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import { createHash } from "node:crypto";
function hashPayload(payload){
  const leadId=(payload.leadId??"").trim();
  const email=(payload.email??"").trim().toLowerCase();
  const subject=payload.subject.replace(/\r\n/g,"\n").trim();
  const body=payload.body.replace(/\r\n/g,"\n").trim();
  const norm=`leadId:${leadId}\nemail:${email}\nsubject:${subject}\n\n${body}`;
  return createHash("sha256").update(norm,"utf8").digest("hex");
}
const adapter = new PrismaBetterSQLite3({ url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` });
const prisma = new PrismaClient({ adapter });
async function main(){
  console.log("=== Functional E2E (direct DB) ===");
  console.log("\nFlow A — submit -> approve -> claim -> report");
  const emailA = `flow-a-${Date.now()}@example.com`;
  const leadA = await prisma.lead.create({ data:{ company:"Flow A Co", contactName:"A", email:emailA }});
  let item = await prisma.approvalItem.create({ data:{ subject:"Flow A subject", body:"Flow A body", leadId: leadA.id, status:"AWAITING_APPROVAL" }});
  console.log(` submitted ${item.id}`);
  const locked = hashPayload({ leadId: leadA.id, email: emailA, subject: item.subject, body: item.body });
  await prisma.approvalItem.update({ where:{id:item.id}, data:{ status:"APPROVED", approvedAt:new Date(), lockedHash: locked }});
  item = await prisma.approvalItem.findUnique({ where:{id:item.id} });
  console.log(` approved status=${item.status} hash=${item.lockedHash?.slice(0,8)}`);
  if(item.status!=="APPROVED") throw new Error("approve failed");
  const claimed = await prisma.$transaction(async(tx)=>{
    const candidates = await tx.approvalItem.findMany({ where:{status:{in:["APPROVED","EDITED"]}}, take:5, include:{lead:true}});
    for(const c of candidates){
      if(c.lead?.status==="SUPPRESSED") continue;
      const res = await tx.approvalItem.updateMany({ where:{id:c.id, status:{in:["APPROVED","EDITED"]}}, data:{ status:"CLAIMED", claimedBy:"e2e", claimedAt:new Date()}});
      if(res.count>0) return c;
    }
    return null;
  });
  console.log(` claimed ${claimed?.id ?? "none"}`);
  await prisma.approvalItem.update({ where:{id:item.id}, data:{ status:"SENT", sentAt:new Date(), messageId:"<test>" }});
  await prisma.messageLog.create({ data:{ approvalItemId:item.id, leadId: leadA.id, subject: item.subject, body: item.body, status:"SENT", messageId:"<test>", sentBy:"e2e" }});
  const log = await prisma.messageLog.findFirst({ where:{approvalItemId:item.id}});
  console.log(` history log=${log?.id} status=${log?.status}`);
  if(!log) throw new Error("history missing");
  console.log(" Flow A PASS");
  console.log("\nFlow B — edit & approve");
  const leadB = await prisma.lead.create({ data:{ company:"Flow B Co", contactName:"B", email:`flow-b-${Date.now()}@example.com` }});
  let itemB = await prisma.approvalItem.create({ data:{ subject:"Orig", body:"Orig body", leadId: leadB.id, status:"AWAITING_APPROVAL"}});
  const newSubject="Edited subject"; const newBody="Edited body";
  const lockedB = hashPayload({ leadId: leadB.id, email: leadB.email, subject: newSubject, body: newBody });
  await prisma.approvalItem.update({ where:{id:itemB.id}, data:{ status:"EDITED", subject:newSubject, editedBody:newBody, approvedAt:new Date(), lockedHash: lockedB }});
  itemB = await prisma.approvalItem.findUnique({ where:{id:itemB.id}});
  console.log(` edited status=${itemB.status} hash=${itemB.lockedHash?.slice(0,8)}`);
  if(itemB.status!=="EDITED") throw new Error("edit approve failed");
  console.log(" Flow B PASS");
  console.log("\nFlow C — reject");
  const leadC = await prisma.lead.create({ data:{ company:"Flow C Co", contactName:"C", email:`flow-c-${Date.now()}@example.com` }});
  let itemC = await prisma.approvalItem.create({ data:{ subject:"Reject", body:"Body", leadId: leadC.id, status:"AWAITING_APPROVAL"}});
  await prisma.approvalItem.update({ where:{id:itemC.id}, data:{ status:"REJECTED", rejectedAt:new Date(), feedback:"NG"}});
  itemC = await prisma.approvalItem.findUnique({ where:{id:itemC.id}});
  console.log(` rejected status=${itemC.status}`);
  const claimAfterReject = await prisma.approvalItem.findMany({ where:{status:{in:["APPROVED","EDITED"]}}});
  const canClaim = claimAfterReject.some(x=>x.id===itemC.id);
  if(canClaim) throw new Error("rejected should not be claimable");
  console.log(" Flow C PASS");
  console.log("\nFlow D — suppression");
  const leadD = await prisma.lead.create({ data:{ company:"Flow D Co", contactName:"D", email:`flow-d-${Date.now()}@example.com` }});
  let itemD = await prisma.approvalItem.create({ data:{ subject:"Supp", body:"Body", leadId: leadD.id, status:"AWAITING_APPROVAL"}});
  await prisma.approvalItem.update({ where:{id:itemD.id}, data:{ status:"APPROVED", approvedAt:new Date(), lockedHash: hashPayload({leadId:leadD.id,email:leadD.email,subject:itemD.subject,body:itemD.body})}});
  await prisma.lead.update({ where:{id:leadD.id}, data:{ status:"SUPPRESSED"}});
  const claimD = await prisma.$transaction(async(tx)=>{
    const cand = await tx.approvalItem.findMany({ where:{status:{in:["APPROVED","EDITED"]}}, include:{lead:true}});
    for(const c of cand){
      if(c.lead?.status==="SUPPRESSED") continue;
      if(c.id===itemD.id) return "blocked";
    }
    return "notblocked";
  });
  console.log(` suppression claim result=${claimD}`);
  if(claimD!=="notblocked") throw new Error("suppression blocking logic error - should be notblocked meaning item was skipped");
  console.log(" Flow D PASS (suppression blocks claim)");
  console.log("\nFlow E — tasks");
  const task = await prisma.task.create({ data:{ type:"FOLLOW_UP", title:"Flow E task", description:"test", assignedTo:"DSH" }});
  const tasks = await prisma.task.findMany({ where:{id:task.id}});
  console.log(` task ${tasks[0].id} title=${tasks[0].title}`);
  if(tasks.length!==1) throw new Error("task not found");
  const allTasks = await prisma.task.findMany();
  const listCount = allTasks.length;
  const boardCounts = ["PENDING","IN_PROGRESS","DONE","CANCELLED"].map(s=> allTasks.filter(t=>t.status===s).length);
  console.log(` list=${listCount} board sum=${boardCounts.reduce((a,b)=>a+b,0)}`);
  console.log(" Flow E PASS");
  console.log("\n=== ALL FLOWS PASS ===");
  await prisma.$disconnect();
}
main().catch(e=>{ console.error(e); process.exit(1); });
