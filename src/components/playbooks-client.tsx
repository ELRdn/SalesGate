"use client";
import { BookOpen, Check, Download, MoreHorizontal, Plus, Sparkles, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader } from "@/components/ui";
import { applyPlaybook, deletePlaybook, exportPlaybook, importPlaybook } from "@/lib/actions";

type PB = { id:string; name:string; description:string; version:string; content:string; source:string; updated:string; createdAt:string };

export function PlaybooksClient({ initialPlaybooks }: { initialPlaybooks: PB[] }){
  const [selected,setSelected]=useState<PB|null>(null);
  const router=useRouter();
  const [isPending,startTransition]=useTransition();
  const handleApply=(id:string)=>{
    startTransition(async()=>{
      try{ await applyPlaybook(id); alert("プレイブックを適用しました"); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:"適用に失敗"); }
    });
  };
  const handleDelete=(id:string)=>{
    if(!confirm("このプレイブックを削除しますか？")) return;
    startTransition(async()=>{
      try{ await deletePlaybook(id); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:"削除に失敗"); }
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
        try{ const r=await importPlaybook(text); alert(`${r.name} をインポートしました`); router.refresh(); }catch(e){ alert(e instanceof Error?e.message:"インポート失敗"); }
      });
    };
    input.click();
  };
  return <div className="workspace-page"><PageHeader title="プレイブック" description="営業ルール、フォローアップ、レビュー基準を再利用可能な設定として管理します。" action={<div className="header-actions"><button className="btn ghost" onClick={handleImport} disabled={isPending}><Upload size={15}/>インポート</button><button className="btn ghost" onClick={handleExport}><Download size={15}/>現在の設定をエクスポート</button></div>}/>
    <div className="playbook-hero"><div><span><Sparkles size={14}/>Community-ready configuration</span><h2>営業オペレーションを「再現可能な資産」に</h2><p>日次上限、フォローアップ間隔、レビュー基準などを1つのパッケージとして共有できます。</p></div><button className="btn ghost" onClick={handleExport}><Download size={15}/>現在の設定をエクスポート</button></div>
    {initialPlaybooks.length===0? <div className="empty-state" style={{minHeight:240,padding:20}}><strong>プレイブックはありません</strong><span>現在の設定をエクスポートするか、JSONをインポートしてください。</span></div> :
    <div className="playbook-grid">{initialPlaybooks.map((item)=><article className="playbook-card" key={item.id}><div className="playbook-icon"><BookOpen size={22}/></div><div className="playbook-top"><div><span className="version">{item.version}</span><span className="playbook-status">{item.source||"manual"}</span></div><button className="icon-btn" onClick={()=>handleDelete(item.id)}><MoreHorizontal size={18}/></button></div><h3>{item.name}</h3><p>{item.description||"説明なし"}</p><div className="playbook-meta"><span>更新 {item.updated}</span></div><div className="playbook-actions"><button className="btn ghost compact" onClick={()=>setSelected(item)}>詳細</button><button className="btn primary compact" onClick={()=>handleApply(item.id)} disabled={isPending}>適用</button></div></article>)}</div>}
    {selected? <Modal title={selected.name} onClose={()=>setSelected(null)}><div className="modal-body playbook-detail"><div className="detail-grid"><div><span>Version</span><strong>{selected.version}</strong></div><div><span>更新</span><strong>{selected.updated}</strong></div><div><span>Source</span><strong>{selected.source||"—"}</strong></div></div><div className="code-preview">{selected.content.slice(0,2000)}</div></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setSelected(null)}>閉じる</button><button className="btn ghost" onClick={handleExport}><Download size={14}/>JSON</button></div></Modal>:null}
  </div>;
}
