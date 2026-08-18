"use client";

import { Ban, Plus, Search, ShieldBan, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { suppressionEntries as seedEntries } from "@/data/mock";
import { Modal, PageHeader, Panel } from "@/components/ui";

export default function SuppressionPage() {
  const [entries, setEntries] = useState(seedEntries);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => entries.filter((x) => `${x.email} ${x.reason} ${x.source}`.toLowerCase().includes(query.toLowerCase())), [entries, query]);

  return (
    <div className="workspace-page">
      <PageHeader title="抑制リスト" description="送信禁止アドレスを管理し、エージェントによる誤送信を構造的に防ぎます。" action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={15} />抑制を追加</button>} />
      <div className="safety-banner">
        <div className="safety-icon"><ShieldBan size={23} /></div>
        <div><strong>抑制リストは submit_draft 時点で強制チェックされます</strong><p>登録済みアドレスへの下書き提出は、承認キューに入る前にブロックされます。</p></div>
        <b>{entries.length}<small>件</small></b>
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="メールアドレス・理由を検索" /></label>
          <button className="btn ghost compact"><Upload size={14} />CSVインポート</button>
        </div>
        <div className="data-table suppression-table">
          <div className="table-head"><span>メールアドレス</span><span>理由</span><span>登録元</span><span>登録日</span><span>登録者</span><span></span></div>
          {rows.map((item) => (
            <div className="table-row static" key={item.id}>
              <span className="suppressed-email"><Ban size={14} />{item.email}</span>
              <span>{item.reason}</span>
              <span>{item.source}</span>
              <span>{item.added}</span>
              <span>{item.owner}</span>
              <span><button className="icon-danger" onClick={() => setEntries((prev) => prev.filter((x) => x.id !== item.id))}><Trash2 size={15} /></button></span>
            </div>
          ))}
        </div>
      </Panel>
      {adding ? <AddSuppressionModal onClose={() => setAdding(false)} onAdd={(email, reason) => { setEntries((prev) => [{ id: Date.now(), email, reason, source: "管理画面", added: "2026/08/18", owner: "Admin User" }, ...prev]); setAdding(false); }} /> : null}
    </div>
  );
}

function AddSuppressionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (email: string, reason: string) => void }) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Modal title="抑制リストに追加" onClose={onClose}>
      <div className="modal-body form-stack">
        <label>メールアドレス<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" type="email" /></label>
        <label>理由<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="配信停止依頼、手動抑制など" /></label>
        <div className="modal-info danger-info">追加すると、このアドレスへの新規下書き提出が即時ブロックされます。</div>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>キャンセル</button>
        <button className="btn destructive" disabled={!email} onClick={() => onAdd(email, reason || "手動抑制")}>抑制する</button>
      </div>
    </Modal>
  );
}
