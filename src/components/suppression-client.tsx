"use client";
import { Ban, Plus, Search, ShieldBan, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader, Panel } from "@/components/ui";
import { updateLeadStatus } from "@/lib/actions";

type Entry = { id:string; email:string; reason:string; source:string; added:string; owner:string };

export function SuppressionClient({ initialEntries }: { initialEntries: Entry[] }){
  const [query,setQuery]=useState("");
  const [adding,setAdding]=useState(false);
  const router=useRouter();
  const rows=useMemo(()=>initialEntries.filter((x)=>`${x.email} ${x.reason} ${x.source}`.toLowerCase().includes(query.toLowerCase())),[initialEntries,query]);
  const [isPending,startTransition]=useTransition();
  const handleRemove=(id:string, email:string)=>{
    if(!confirm(`${email} を抑制リストから解除しますか？`)) return;
    startTransition(async()=>{
      try{ await updateLeadStatus(id,"ACTIVE"); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:"解除に失敗しました"); }
    });
  };
  return <div className="workspace-page"><PageHeader title="抑制リスト" description="送信禁止アドレスを管理し、エージェントによる誤送信を構造的に防ぎます。" action={<button className="btn primary" onClick={()=>setAdding(true)}><Plus size={15}/>抑制を追加</button>}/>
    <div className="safety-banner"><div className="safety-icon"><ShieldBan size={23}/></div><div><strong>抑制リストは submit_draft 時点で強制チェックされます</strong><p>登録済みアドレスへの下書き提出は、承認キューに入る前にブロックされます。</p></div><b>{initialEntries.length}<small>件</small></b></div>
    <Panel className="data-panel"><div className="data-toolbar"><label className="search-box wide"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="メールアドレス・理由を検索"/></label></div>
      <div className="data-table suppression-table"><div className="table-head"><span>メールアドレス</span><span>理由</span><span>登録元</span><span>登録日</span><span>登録者</span><span></span></div>
        {rows.length===0? <div className="empty-state" style={{minHeight:120,padding:20}}><strong>抑制リストは空です</strong><span>抑制されたリードがここに表示されます。</span></div> : rows.map((item)=><div className="table-row static" key={item.id}><span className="suppressed-email"><Ban size={14}/>{item.email}</span><span>{item.reason}</span><span>{item.source}</span><span>{item.added}</span><span>{item.owner}</span><span><button className="icon-danger" onClick={()=>handleRemove(item.id,item.email)} disabled={isPending}><Trash2 size={15}/></button></span></div>)}
      </div>
    </Panel>
    {adding? <AddSuppressionModal onClose={()=>setAdding(false)} onSuccess={()=>{setAdding(false); router.refresh();}}/>:null}
  </div>;
}
function AddSuppressionModal({onClose,onSuccess}:{onClose:()=>void; onSuccess:()=>void}){
  const [email,setEmail]=useState("");
  const [reason,setReason]=useState("");
  const [isPending,startTransition]=useTransition();
  const [error,setError]=useState<string|null>(null);
  const handle=()=>{
    setError(null);
    if(!email.trim()||!email.includes("@")){ setError("有効なメールアドレスを入力してください"); return; }
    startTransition(async()=>{
      try{
        const res = await fetch("/api/suppression",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(), reason:reason.trim()||"手動抑制"})});
        const data=await res.json();
        if(!res.ok) throw new Error(data.error||"追加に失敗しました");
        onSuccess();
      }catch(e){ setError(e instanceof Error?e.message:"追加に失敗しました"); }
    });
  };
  return <Modal title="抑制リストに追加" onClose={onClose}><div className="modal-body form-stack"><label>メールアドレス<input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="contact@example.com" type="email"/></label><label>理由<textarea value={reason} onChange={(e)=>setReason(e.target.value)} rows={4} placeholder="配信停止依頼、手動抑制など"/></label>{error? <div className="modal-info danger-info">{error}</div>:null}<div className="modal-info danger-info">追加すると、このアドレスへの新規下書き提出が即時ブロックされます。</div></div><div className="modal-actions"><button className="btn ghost" onClick={onClose} disabled={isPending}>キャンセル</button><button className="btn destructive" disabled={!email||isPending} onClick={handle}>{isPending?"追加中...":"抑制する"}</button></div></Modal>;
}
