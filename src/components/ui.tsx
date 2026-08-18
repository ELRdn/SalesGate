"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { Agent, Risk } from "@/types";

export const agentClass: Record<Agent, string> = {
  DSH: "agent agent-dsh",
  OpenClaw: "agent agent-openclaw",
  "Claude Code": "agent agent-claude",
  Codex: "agent agent-codex",
};

export const riskClass: Record<Risk, string> = {
  低リスク: "risk risk-low",
  中リスク: "risk risk-mid",
  高リスク: "risk risk-high",
};

export function AgentChip({ agent }: { agent: Agent }) {
  return <span className={agentClass[agent]}>{agent}</span>;
}

export function RiskChip({ risk }: { risk: Risk }) {
  return <span className={riskClass[risk]}>{risk}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHead({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return (
    <div className="panel-head">
      <h2>
        {title}
        {meta ? <span> {meta}</span> : null}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
    >
      <i />
    </button>
  );
}

export function Modal({ title, children, onClose, width = "640px" }: { title: string; children: ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <div className="modal" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="empty-state">
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
