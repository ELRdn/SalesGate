"use client";

import { Bell, ChevronDown, Globe, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { useLocale } from "@/i18n/provider";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/i18n/config";

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
  const [healthOpen, setHealthOpen] = useState(false);
  const [health, setHealth] = useState<Record<string, string> | null>(null);
  const router = useRouter();
  const { t } = useI18n();
  const locale = useLocale();

  // Close popovers on outside click / escape
  useEffect(() => {
    const onClick = () => {
      setProfileOpen(false);
      setNotificationsOpen(false);
      setHealthOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setHealthOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (healthOpen && !health) {
      fetch("/api/health")
        .then((r) => r.json())
        .then(setHealth)
        .catch(() => setHealth({ database: "disconnected" }));
    }
  }, [healthOpen, health]);

  const toggleLocale = () => {
    const next: Locale = locale === "en" ? "ja" : "en";
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
    // also persist to Setting via API
    fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) }).catch(() => {});
    window.location.reload();
  };

  const hasNotifications = pendingCount > 0;

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onToggleSidebar} aria-label={t("sidebar.collapse")}>
        <Menu size={19} />
      </button>
      <div className="top-popover-wrap" onClick={(e) => e.stopPropagation()}>
        <button className="top-context" title={t("health.title")} onClick={() => setHealthOpen((v) => !v)} aria-label={t("health.title")}>
          <span className="live-dot" />
          {t("topbar.allSystems")}
        </button>
        {healthOpen ? (
          <div className="popover health-popover">
            <div className="popover-title">
              <strong>{t("health.title")}</strong>
            </div>
            <div className="health-grid">
              <div>
                <span>{t("health.database")}</span>
                <b className={health?.database === "connected" ? "ok" : "bad"}>● {health ? t(`health.${health.database}` as never) : "..."}</b>
              </div>
              <div>
                <span>{t("health.mcpServer")}</span>
                <b className="ok">● {t("health.ready")}</b>
              </div>
              <div>
                <span>{t("health.authentication")}</span>
                <b className={health?.authentication === "enabled" ? "ok" : "off"}>● {health ? t(`health.${health.authentication}` as never) : "..."}</b>
              </div>
              <div>
                <span>{t("health.slack")}</span>
                <b className={health?.slack === "configured" ? "ok" : "off"}>● {health ? t(`health.${health.slack}` as never) : "..."}</b>
              </div>
              <div>
                <span>{t("health.scheduler")}</span>
                <b className="ok">● {t("health.ready")}</b>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="top-spacer" />
      <div className="top-popover-wrap" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn notification"
          aria-label={t("topbar.notifications")}
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
              <strong>{t("topbar.notifications")}</strong>
              <button onClick={() => notify(t("topbar.markAllRead"))}>{t("topbar.markAllRead")}</button>
            </div>
            {hasNotifications ? (
              <button className="notification-item" onClick={() => router.push("/approvals")}>
                <i className="green-dot" />
                <span>
                  <strong>{t("topbar.newApproval")}</strong>
                  <small>
                    {t("topbar.notifications")} {pendingCount} · {t("topbar.viewQueue")}
                  </small>
                </span>
              </button>
            ) : (
              <div className="notification-empty">
                <span>{t("topbar.noNotifications")}</span>
                <small>{t("topbar.noNotificationsDesc")}</small>
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
            <strong>{t("topbar.profile")}</strong>
            <small>{t("topbar.admin")}</small>
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
              {t("topbar.account")}
            </button>
            <button
              onClick={() => {
                router.push("/settings");
                setProfileOpen(false);
              }}
            >
              <Settings size={16} />
              {t("topbar.settings")}
            </button>
            <button
              onClick={() => {
                toggleLocale();
                setProfileOpen(false);
              }}
            >
              <Globe size={16} />
              {locale === "en" ? "日本語" : "English"}
            </button>
            <div className="popover-separator" />
            <button
              onClick={() => {
                notify(t("topbar.loggedOut"));
                setProfileOpen(false);
              }}
            >
              <LogOut size={16} />
              {t("topbar.logout")}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
