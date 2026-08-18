"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { PageKey } from "@/types";

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<PageKey>("ダッシュボード");
  const [toast, setToast] = useState<string | null>(null);

  const pendingCount = 5; // TODO: 実際のDBから取得
  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 2600);
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar active={page} setActive={setPage} pendingCount={pendingCount} collapsed={collapsed} />
      <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} setPage={setPage} notify={notify} />
      <main className="main-area">{children}</main>
      {toast ? (
        <div className="toast">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast(null)}><X size={15} /></button>
        </div>
      ) : null}
    </div>
  );
}
