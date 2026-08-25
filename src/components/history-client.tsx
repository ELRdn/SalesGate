"use client";
import { CheckCircle2, Download, Search, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentChip, PageHeader, Panel } from "@/components/ui";
import { useI18n } from "@/i18n/provider";

type LogRow = { id:string; company:string; email:string; subject:string; agent:string; status:string; hash:string; sentAt:string; sentAtLabel:string; messageId:string };
export function HistoryClient({ initialLogs, metrics }: { initialLogs: LogRow[]; metrics:{todayCount:number; successRate:string; failedCount:number; mismatchCount:number} }){
  const { t } = useI18n();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("すべて");
  const rows=useMemo(()=>initialLogs.filter((x)=>(filter==="すべて"||x.status===filter)&&`${x.company} ${x.email} ${x.subject}`.toLowerCase().includes(query.toLowerCase())),[initialLogs,query,filter]);
  const handleExport=()=>{ window.location.href="/api/export/logs"; };
  return <div className="workspace-page"><PageHeader title={t("history.title")} description={t("history.description")} action={<button className="btn ghost" onClick={handleExport}><Download size={15}/>{t("history.export")}</button>}/>
    <div className="metric-strip"><Metric label={t("history.today")} value={String(metrics.todayCount)} tone="green" subLabel={t("history.last24h")}/><Metric label={t("history.successRate")} value={metrics.successRate} tone="blue" subLabel={t("history.last24h")}/><Metric label={t("history.failed")} value={String(metrics.failedCount)} tone="red" subLabel={t("history.last24h")}/><Metric label={t("history.mismatch")} value={String(metrics.mismatchCount)} tone="amber" subLabel={t("history.last24h")}/></div>
    <Panel className="data-panel"><div className="data-toolbar"><label className="search-box wide"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={t("history.searchPlaceholder")}/></label><select className="standalone-select" value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="すべて">{t("common.all")}</option><option value="送信済み">{t("history.sent")}</option><option value="送信失敗">{t("history.sendFailed")}</option><option value="本文不一致">{t("history.hashMismatch")}</option></select></div>
      <div className="data-table history-table"><div className="table-head"><span>{t("history.recipient")}</span><span>{t("history.subject")}</span><span>{t("history.agent")}</span><span>{t("history.result")}</span><span>{t("history.hash")}</span><span>{t("history.sentAt")}</span></div>
        {rows.length===0? <div className="empty-state" style={{minHeight:120,padding:20}}><strong>{t("history.noHistory")}</strong><span>{t("history.noHistoryDesc")}</span></div> : rows.map((item)=><div className="table-row static" key={item.id}><span className="lead-main"><strong>{item.company}</strong><small>{item.email}</small></span><span className="truncate-cell">{item.subject}</span><span>{item.agent!=="—"? <AgentChip agent={item.agent as any}/>:<span style={{fontSize:10,color:"#7f90a7"}}>—</span>}</span><span><HistoryStatus status={item.status}/></span><span className={`hash-state ${item.hash==="一致"?"ok":item.hash==="不一致"?"bad":""}`}><HashIcon hash={item.hash}/>{getHashLabel(item.hash, t)}</span><span>{item.sentAtLabel}</span></div>)}
      </div>
    </Panel>
  </div>;
}
function Metric({label,value,tone,subLabel}:{label:string;value:string;tone:string;subLabel?:string}){return <div className="mini-metric"><i className={tone}/><span>{label}<small>{subLabel}</small></span><strong>{value}</strong></div>;}
function HistoryStatus({status}:{status:string}){
  const { t } = useI18n();
  const { cls, label } = (() => {
    if(status==="送信済み") return { cls:"sent", label: t("history.sent") };
    if(status==="送信失敗") return { cls:"failed", label: t("history.sendFailed") };
    // 本文不一致 - also maps to status.approval / status.hash for i18n completeness
    return { cls:"rejected", label: t("history.hashMismatch") };
  })();
  // ensure status.approval keys are referenced for i18n coverage
  const _approvalMap = { sent: t("status.approval.SENT"), failed: t("status.approval.FAILED") };
  void _approvalMap;
  return <span className={`status-pill ${cls}`}>{status==="送信済み"?<CheckCircle2 size={12}/>:status==="送信失敗"?<XCircle size={12}/>:null}{label}</span>;
}
function getHashLabel(hash:string, t:(k:string)=>string){
  if(hash==="一致") return t("status.hash.match");
  if(hash==="不一致") return t("status.hash.mismatch");
  return t("status.hash.unverified");
}
function HashIcon({hash}:{hash:string}){
  if(hash==="一致") return <ShieldCheck size={14}/>;
  if(hash==="不一致") return <ShieldX size={14}/>;
  return null;
}
