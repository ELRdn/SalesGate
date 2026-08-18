"use client";

import { Bell, ChevronDown, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { useState } from "react";
import type { PageKey } from "@/types";

export function Topbar({ onToggleSidebar, setPage, notify }: { onToggleSidebar: () => void; setPage: (page: PageKey) => void; notify: (text: string) => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onToggleSidebar} aria-label="サイドバー切替">
        <Menu size={19} />
      </button>
      <div className="top-context">
        <span className="live-dot" />
        All systems operational
      </div>
      <div className="top-spacer" />
      <div className="top-popover-wrap">
        <button
          className="icon-btn notification"
          aria-label="通知"
          onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }}
        >
          <Bell size={18} />
          <b>3</b>
        </button>
        {notificationsOpen ? (
          <div className="popover notifications-popover">
            <div className="popover-title">
              <strong>通知</strong>
              <button onClick={() => notify("すべて既読にしました")}>すべて既読</button>
            </div>
            <button className="notification-item">
              <i className="green-dot" />
              <span>
                <strong>新しい承認待ちが追加されました</strong>
                <small>DSH · 株式会社Tech Solutions · 12分前</small>
              </span>
            </button>
            <button className="notification-item">
              <i className="red-dot" />
              <span>
                <strong>本文不一致を検知しました</strong>
                <small>株式会社Edge · 1時間前</small>
              </span>
            </button>
            <button className="notification-item">
              <i className="amber-dot" />
              <span>
                <strong>日次送信数が80%に到達</strong>
                <small>送信上限 40 / 50 · 2時間前</small>
              </span>
            </button>
          </div>
        ) : null}
      </div>
      <div className="top-popover-wrap">
        <button
          className="profile-button"
          onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); }}
        >
          <div className="avatar"><UserRound size={17} /></div>
          <span><strong>Admin User</strong><small>管理者</small></span>
          <ChevronDown size={15} />
        </button>
        {profileOpen ? (
          <div className="popover profile-popover">
            <button onClick={() => { setPage("アカウント"); setProfileOpen(false); }}>
              <UserRound size={16} />アカウント
            </button>
            <button onClick={() => { setPage("設定"); setProfileOpen(false); }}>
              <Settings size={16} />設定
            </button>
            <div className="popover-separator" />
            <button onClick={() => notify("デモ版ではログアウトしません")}>
              <LogOut size={16} />ログアウト
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
