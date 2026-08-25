"use client";
import { CheckCircle2, Download, Search, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentChip, PageHeader, Panel } from "@/components/ui";

type LogRow = { id:string; company:string; email:string; subject:string; agent:string; status:string; hash:string; sentAt:string; sentAtLabel:string; messageId:string };
export function HistoryClient({ initialLogs, metrics }: { initialLogs: LogRow[]; metrics:{todayCount:number; successRate:string; failedCount:number; mismatchCount:number} }){
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("すべて");
  const rows=useMemo(()=>initialLogs.filter((x)=>(filter==="すべて"||x.status===filter)&&`${x.company} ${x.email} ${x.subject}`.toLowerCase().includes(query.toLowerCase())),[initialLogs,query,filter]);
  const handleExport=()=>{ window.location.href="/api/export/logs"; };
  return <div className="workspace-page"><PageHeader title="送信履歴" description="承認後にエージェントが実行した送信結果と監査情報を確認します。" action={<button className="btn ghost" onClick={handleExport}><Download size={15}/>CSVエクスポート</button>}/>
    <div className="metric-strip"><Metric label="本日送信" value={String(metrics.todayCount)} tone="green"/><Metric label="成功率" value={metrics.successRate} tone="blue"/><Metric label="送信失敗" value={String(metrics.failedCount)} tone="red"/><Metric label="本文不一致" value={String(metrics.mismatchCount)} tone="amber"/></div>
    <Panel className="data-panel"><div className="data-toolbar"><label className="search-box wide"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="送信先・件名を検索"/></label><select className="standalone-select" value={filter} onChange={(e)=>setFilter(e.target.value)}><option>すべて</option><option>送信済み</option><option>送信失敗</option><option>本文不一致</option></select></div>
      <div className="data-table history-table"><div className="table-head"><span>送信先</span><span>件名</span><span>Agent</span><span>結果</span><span>本文Hash</span><span>送信日時</span></div>
        {rows.length===0? <div className="empty-state" style={{minHeight:120,padding:20}}><strong>送信履歴はありません</strong><span>承認済みアイテムが送信されるとここに表示されます。</span></div> : rows.map((item)=><div className="table-row static" key={item.id}><span className="lead-main"><strong>{item.company}</strong><small>{item.email}</small></span><span className="truncate-cell">{item.subject}</span><span>{item.agent!=="—"? <AgentChip agent={item.agent as any}/>:<span style={{fontSize:10,color:"#7f90a7"}}>—</span>}</span><span><HistoryStatus status={item.status}/></span><span className={`hash-state ${item.hash==="一致"?"ok":item.hash==="不一致"?"bad":""}`}>{item.hash==="一致"?<ShieldCheck size={14}/>:item.hash==="不一致"?<ShieldX size={14}/>:null}{item.hash}</span><span>{item.sentAtLabel}</span></div>)}
      </div>
    </Panel>
  </div>;
}
function Metric({label,value,tone}:{label:string;value:string;tone:string}){return <div className="mini-metric"><i className={tone}/><span>{label}<small>直近24時間</small></span><strong>{value}</strong></div>;}
function HistoryStatus({status}:{status:string}){ const cls=status==="送信済み"?"sent":status==="送信失敗"?"failed":"rejected"; return <span className={`status-pill ${cls}`}>{status==="送信済み"?<CheckCircle2 size={12}/>:status==="送信失敗"?<XCircle size={12}/>:null}{status}</span>; }
