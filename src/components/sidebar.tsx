"use client";

import { BookOpen, ClipboardCheck, History, House, ListChecks, Plus, Settings, ShieldBan, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "ダッシュボード", href: "/", icon: House, badge: false },
  { label: "承認キュー", href: "/approvals", icon: ClipboardCheck, badge: true },
  { label: "リード", href: "/leads", icon: Users, badge: false },
  { label: "タスク", href: "/tasks", icon: ListChecks, badge: false },
  { label: "送信履歴", href: "/history", icon: History, badge: false },
  { label: "抑制リスト", href: "/suppression", icon: ShieldBan, badge: false },
  { label: "プレイブック", href: "/playbooks", icon: BookOpen, badge: false },
  { label: "設定", href: "/settings", icon: Settings, badge: false },
] as const;

const AGENT_COLORS: Record<string, string> = {
  DSH: "#42c976",
  OpenClaw: "#8b5cf6",
  "Claude Code": "#f59e0b",
  Codex: "#3478f6",
};

function colorFor(name: string) {
  if (AGENT_COLORS[name]) return AGENT_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const palette = ["#42c976", "#8b5cf6", "#f59e0b", "#3478f6", "#ef4444", "#06b6d4", "#ec4899"];
  return palette[hash % palette.length];
}

export function Sidebar({
  pendingCount,
  collapsed,
  version,
  agents,
}: {
  pendingCount: number;
  collapsed: boolean;
  version: string;
  agents: string[];
}) {
  const pathname = usePathname();
  const displayAgents = agents.length > 0 ? agents : ["DSH", "OpenClaw", "Claude Code", "Codex"];

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="traffic-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="brand-copy">
          <strong>SalesGate</strong>
          <span>Approval-first AI SDR Hub</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="メインナビゲーション">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={isActive ? "nav-item active" : "nav-item"}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {badge ? <b className="nav-badge">{pendingCount}</b> : null}
            </Link>
          );
        })}
      </nav>

      <div className="agent-section">
        <div className="section-label">
          <span>エージェント</span>
          <button aria-label="エージェント追加">
            <Plus size={16} />
          </button>
        </div>
        {displayAgents.map((name) => (
          <div className="agent-line" key={name}>
            <i style={{ background: colorFor(name) }} />
            <span>{name}</span>
          </div>
        ))}
      </div>

      <div className="server-card">
        <span>SalesGate v{version}</span>
        <div>
          <i /> MCP Server: <b>Connected</b>
        </div>
      </div>
    </aside>
  );
}
