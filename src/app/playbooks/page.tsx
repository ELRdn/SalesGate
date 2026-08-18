"use client";

import { BookOpen, Check, Download, MoreHorizontal, Plus, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { playbooks } from "@/data/mock";
import { Modal, PageHeader } from "@/components/ui";

export default function PlaybooksPage() {
  const [selected, setSelected] = useState<(typeof playbooks)[number] | null>(null);
  const [activeId, setActiveId] = useState(1);

  return (
    <div className="workspace-page">
      <PageHeader title="プレイブック" description="営業ルール、フォローアップ、レビュー基準を再利用可能な設定として管理します。" action={<div className="header-actions"><button className="btn ghost"><Upload size={15} />インポート</button><button className="btn primary"><Plus size={15} />新規作成</button></div>} />
      <div className="playbook-hero">
        <div>
          <span><Sparkles size={14} />Community-ready configuration</span>
          <h2>営業オペレーションを「再現可能な資産」に</h2>
          <p>日次上限、フォローアップ間隔、レビュー基準などを1つのパッケージとして共有できます。</p>
        </div>
        <button className="btn ghost"><Download size={15} />現在の設定をエクスポート</button>
      </div>
      <div className="playbook-grid">
        {playbooks.map((item) => (
          <article className={`playbook-card ${activeId === item.id ? "active" : ""}`} key={item.id}>
            <div className="playbook-icon"><BookOpen size={22} /></div>
            <div className="playbook-top">
              <div>
                <span className="version">{item.version}</span>
                {activeId === item.id ? <span className="applied"><Check size={12} />適用中</span> : <span className={`playbook-status ${item.status === "下書き" ? "draft" : ""}`}>{item.status}</span>}
              </div>
              <button className="icon-btn"><MoreHorizontal size={18} /></button>
            </div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="playbook-meta"><span>{item.rules} rules</span><span>更新 {item.updated}</span></div>
            <div className="playbook-actions">
              <button className="btn ghost compact" onClick={() => setSelected(item)}>詳細</button>
              {activeId !== item.id ? <button className="btn primary compact" onClick={() => setActiveId(item.id)}>適用</button> : <button className="btn ghost compact" disabled>適用中</button>}
            </div>
          </article>
        ))}
      </div>
      {selected ? (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="modal-body playbook-detail">
            <div className="detail-grid">
              <div><span>Version</span><strong>{selected.version}</strong></div>
              <div><span>ルール数</span><strong>{selected.rules}</strong></div>
              <div><span>状態</span><strong>{selected.status}</strong></div>
              <div><span>最終更新</span><strong>{selected.updated}</strong></div>
            </div>
            <div className="code-preview">{`{\n  "dailySendLimit": 50,\n  "followUpDays": 3,\n  "maxFollowUps": 3,\n  "requireHumanApproval": true\n}`}</div>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setSelected(null)}>閉じる</button>
            <button className="btn ghost"><Download size={14} />JSON</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
