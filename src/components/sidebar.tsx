"use client";

import { BookOpen, ClipboardCheck, History, House, ListChecks, Plus, Settings, ShieldBan, Users } from "lucide-react";
import type { PageKey } from "@/types";

const navItems: Array<{ label: PageKey; icon: typeof House; badge?: boolean }> = [
  { label: "ダッシュボード", icon: House },
  { label: "承認キュー", icon: ClipboardCheck, badge: true },
  { label: "リード", icon: Users },
  { label: "タスク", icon: ListChecks },
  { label: "送信履歴", icon: History },
  { label: "抑制リスト", icon: ShieldBan },
  { label: "プレイブック", icon: BookOpen },
  { label: "設定", icon: Settings },
];

const agents = [
  ["DSH", "#42c976"],
  ["OpenClaw", "#8b5cf6"],
  ["Claude Code", "#f59e0b"],
  ["Codex", "#3478f6"],
];

export function Sidebar({ active, setActive, pendingCount, collapsed }: { active: PageKey; setActive: (page: PageKey) => void; pendingCount: number; collapsed: boolean }) {
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="traffic-mark" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="brand-copy">
          <strong>SalesGate</strong>
          <span>Approval-first AI SDR Hub</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="メインナビゲーション">
        {navItems.map(({ label, icon: Icon, badge }) => (
          <button
            key={label}
            className={active === label ? "nav-item active" : "nav-item"}
            onClick={() => setActive(label)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {badge ? <b className="nav-badge">{pendingCount}</b> : null}
          </button>
        ))}
      </nav>

      <div className="agent-section">
        <div className="section-label">
          <span>エージェント</span>
          <button aria-label="エージェント追加"><Plus size={16} /></button>
        </div>
        {agents.map(([name, color]) => (
          <div className="agent-line" key={name}>
            <i style={{ background: color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>

      <div className="server-card">
        <span>SalesGate v0.4.0-beta</span>
        <div><i /> MCP Server: <b>Connected</b></div>
      </div>
    </aside>
  );
}
