"use client";
import { BookOpen, Download, MoreHorizontal, Sparkles, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader } from "@/components/ui";
import { applyPlaybook, deletePlaybook, exportPlaybook, importPlaybook } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type PB = { id:string; name:string; description:string; version:string; content:string; source:string; updated:string; createdAt:string };

export function PlaybooksClient({ initialPlaybooks }: { initialPlaybooks: PB[] }){
  const { t } = useI18n();
  const [selected,setSelected]=useState<PB|null>(null);
  const router=useRouter();
  const [isPending,startTransition]=useTransition();
  const handleApply=(id:string)=>{
    startTransition(async()=>{
      try{ await applyPlaybook(id); alert(t("playbooks.applySuccess")); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:t("playbooks.applyFailed")); }
    });
  };
  const handleDelete=(id:string)=>{
    if(!confirm(t("playbooks.deleteConfirm"))) return;
    startTransition(async()=>{
      try{ await deletePlaybook(id); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:t("playbooks.applyFailed")); }
    });
  };
  const handleExport=async()=>{
    const json=await exportPlaybook();
    const blob=new Blob([json],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="salesgate-playbook.json"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport=()=>{
    const input=document.createElement("input"); input.type="file"; input.accept=".json";
    input.onchange=async()=>{
      const file=input.files?.[0]; if(!file) return;
      const text=await file.text();
      startTransition(async()=>{
        try{ const r=await importPlaybook(text); alert(t("playbooks.importSuccess", { name: r.name })); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:t("playbooks.importFailed")); }
      });
    };
    input.click();
  };
  return <div className="workspace-page"><PageHeader title={t("playbooks.title")} description={t("playbooks.description")} action={<div className="header-actions"><button className="btn ghost" onClick={handleImport} disabled={isPending}><Upload size={15}/>{t("playbooks.import")}</button><button className="btn ghost" onClick={handleExport}><Download size={15}/>{t("playbooks.exportCurrent")}</button></div>}/>
    <div className="playbook-hero"><div><span><Sparkles size={14}/>{t("playbooks.heroLabel")}</span><h2>{t("playbooks.heroTitle")}</h2><p>{t("playbooks.heroDesc")}</p></div><button className="btn ghost" onClick={handleExport}><Download size={15}/>{t("playbooks.exportCurrent")}</button></div>
    {initialPlaybooks.length===0? <div className="empty-state" style={{minHeight:240,padding:20}}><strong>{t("playbooks.noPlaybooks")}</strong><span>{t("playbooks.noPlaybooksDesc")}</span></div> :
    <div className="playbook-grid">{initialPlaybooks.map((item)=><article className="playbook-card" key={item.id}><div className="playbook-icon"><BookOpen size={22}/></div><div className="playbook-top"><div><span className="version">{item.version}</span><span className="playbook-status">{item.source||"manual"}</span></div><button className="icon-btn" onClick={()=>handleDelete(item.id)}><MoreHorizontal size={18}/></button></div><h3>{item.name}</h3><p>{item.description||"—"}</p><div className="playbook-meta"><span>{t("playbooks.updated")} {item.updated}</span></div><div className="playbook-actions"><button className="btn ghost compact" onClick={()=>setSelected(item)}>{t("playbooks.detail")}</button><button className="btn primary compact" onClick={()=>handleApply(item.id)} disabled={isPending}>{t("playbooks.apply")}</button></div></article>)}</div>}
    {selected? <Modal title={selected.name} onClose={()=>setSelected(null)}><div className="modal-body playbook-detail"><div className="detail-grid"><div><span>{t("playbooks.version")}</span><strong>{selected.version}</strong></div><div><span>{t("playbooks.updated")}</span><strong>{selected.updated}</strong></div><div><span>{t("playbooks.source")}</span><strong>{selected.source||"—"}</strong></div></div><div className="code-preview">{selected.content.slice(0,2000)}</div></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setSelected(null)}>{t("common.close")}</button><button className="btn ghost" onClick={handleExport}><Download size={14}/>{t("common.download")}</button></div></Modal>:null}
  </div>;
}
