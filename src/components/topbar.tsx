"use client";

import { Bell, ChevronDown, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Topbar({
  onToggleSidebar,
  notify,
  pendingCount,
}: {
  onToggleSidebar: () => void;
  notify: (text: string) => void;
  pendingCount: number;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();

  // Close popovers on outside click / escape
  useEffect(() => {
    const onClick = () => {
      setProfileOpen(false);
      setNotificationsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const hasNotifications = pendingCount > 0;

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
      <div className="top-popover-wrap" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn notification"
          aria-label="通知"
          onClick={() => {
            setNotificationsOpen((v) => !v);
            setProfileOpen(false);
          }}
        >
          <Bell size={18} />
          {hasNotifications ? <b>{pendingCount > 9 ? "9+" : pendingCount}</b> : null}
        </button>
        {notificationsOpen ? (
          <div className="popover notifications-popover">
            <div className="popover-title">
              <strong>通知</strong>
              <button onClick={() => notify("すべて既読にしました")}>すべて既読</button>
            </div>
            {hasNotifications ? (
              <button className="notification-item" onClick={() => router.push("/approvals")}>
                <i className="green-dot" />
                <span>
                  <strong>新しい承認待ちが追加されました</strong>
                  <small>承認待ち {pendingCount} 件 · 承認キューを確認</small>
                </span>
              </button>
            ) : (
              <div className="notification-empty">
                <span>通知はありません</span>
                <small>新しい承認やリスクアラートがここに表示されます</small>
              </div>
            )}
            {/* Derived operational alerts could be added here from /api/notifications */}
          </div>
        ) : null}
      </div>
      <div className="top-popover-wrap" onClick={(e) => e.stopPropagation()}>
        <button
          className="profile-button"
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotificationsOpen(false);
          }}
        >
          <div className="avatar">
            <UserRound size={17} />
          </div>
          <span>
            <strong>Admin User</strong>
            <small>管理者</small>
          </span>
          <ChevronDown size={15} />
        </button>
        {profileOpen ? (
          <div className="popover profile-popover">
            <button
              onClick={() => {
                router.push("/account");
                setProfileOpen(false);
              }}
            >
              <UserRound size={16} />
              アカウント
            </button>
            <button
              onClick={() => {
                router.push("/settings");
                setProfileOpen(false);
              }}
            >
              <Settings size={16} />
              設定
            </button>
            <div className="popover-separator" />
            <button
              onClick={() => {
                notify("ログアウトしました");
                setProfileOpen(false);
              }}
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
