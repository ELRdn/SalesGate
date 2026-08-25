"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function Shell({
  children,
  pendingCount,
  version,
  agents,
}: {
  children: React.ReactNode;
  pendingCount: number;
  version: string;
  agents: string[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 2600);
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar pendingCount={pendingCount} collapsed={collapsed} version={version} agents={agents} />
      <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} notify={notify} pendingCount={pendingCount} />
      <main className="main-area">{children}</main>
      {toast ? (
        <div className="toast">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
