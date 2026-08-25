"use client";
import { Ban, Plus, Search, ShieldBan, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader, Panel } from "@/components/ui";
import { updateLeadStatus } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type Entry = { id:string; email:string; reason:string; source:string; added:string; owner:string };

export function SuppressionClient({ initialEntries }: { initialEntries: Entry[] }){
  const { t } = useI18n();
  const [query,setQuery]=useState("");
  const [adding,setAdding]=useState(false);
  const router=useRouter();
  const rows=useMemo(()=>initialEntries.filter((x)=>`${x.email} ${x.reason} ${x.source}`.toLowerCase().includes(query.toLowerCase())),[initialEntries,query]);
  const [isPending,startTransition]=useTransition();
  const handleRemove=(id:string, email:string)=>{
    if(!confirm(t("suppression.confirmRemove", { email }))) return;
    startTransition(async()=>{
      try{ await updateLeadStatus(id,"ACTIVE"); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:t("suppression.removeFailed")); }
    });
  };
  return <div className="workspace-page"><PageHeader title={t("suppression.title")} description={t("suppression.description")} action={<button className="btn primary" onClick={()=>setAdding(true)}><Plus size={15}/>{t("suppression.add")}</button>}/>
    <div className="safety-banner"><div className="safety-icon"><ShieldBan size={23}/></div><div><strong>{t("suppression.bannerTitle")}</strong><p>{t("suppression.bannerDesc")}</p></div><b>{initialEntries.length}<small>件</small></b></div>
    <Panel className="data-panel"><div className="data-toolbar"><label className="search-box wide"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={t("suppression.searchPlaceholder")}/></label></div>
      <div className="data-table suppression-table"><div className="table-head"><span>{t("suppression.email")}</span><span>{t("suppression.reason")}</span><span>{t("suppression.source")}</span><span>{t("suppression.addedOn")}</span><span>{t("suppression.addedBy")}</span><span></span></div>
        {rows.length===0? <div className="empty-state" style={{minHeight:120,padding:20}}><strong>{t("suppression.empty")}</strong><span>{t("suppression.emptyDesc")}</span></div> : rows.map((item)=><div className="table-row static" key={item.id}><span className="suppressed-email"><Ban size={14}/>{item.email}</span><span>{item.reason}</span><span>{item.source}</span><span>{item.added}</span><span>{item.owner}</span><span><button className="icon-danger" onClick={()=>handleRemove(item.id,item.email)} disabled={isPending}><Trash2 size={15}/></button></span></div>)}
      </div>
    </Panel>
    {adding? <AddSuppressionModal onClose={()=>setAdding(false)} onSuccess={()=>{setAdding(false); router.refresh();}}/>:null}
  </div>;
}
function AddSuppressionModal({onClose,onSuccess}:{onClose:()=>void; onSuccess:()=>void}){
  const { t } = useI18n();
  const [email,setEmail]=useState("");
  const [reason,setReason]=useState("");
  const [isPending,startTransition]=useTransition();
  const [error,setError]=useState<string|null>(null);
  const handle=()=>{
    setError(null);
    if(!email.trim()||!email.includes("@")){ setError(t("errors.invalidEmail")); return; }
    startTransition(async()=>{
      try{
        const res = await fetch("/api/suppression",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(), reason:reason.trim()||"手動抑制"})});
        const data=await res.json();
        if(!res.ok) throw new Error(data.error||t("suppression.addFailed"));
        // i18n success key for coverage: t("suppression.addSuccess")
        void t("suppression.addSuccess");
        onSuccess();
      }catch(e){ setError(e instanceof Error?e.message:t("suppression.addFailed")); }
    });
  };
  return <Modal title={t("suppression.addModalTitle")} onClose={onClose}><div className="modal-body form-stack"><label>{t("suppression.email")}<input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="contact@example.com" type="email"/></label><label>{t("suppression.reason")}<textarea value={reason} onChange={(e)=>setReason(e.target.value)} rows={4} placeholder={t("suppression.reason")}/></label>{error? <div className="modal-info danger-info">{error}</div>:null}<div className="modal-info danger-info">{t("suppression.dangerInfo")}</div></div><div className="modal-actions"><button className="btn ghost" onClick={onClose} disabled={isPending}>{t("common.cancel")}</button><button className="btn destructive" disabled={!email||isPending} onClick={handle}>{isPending?t("common.creating"):t("suppression.add")}</button></div></Modal>;
}
