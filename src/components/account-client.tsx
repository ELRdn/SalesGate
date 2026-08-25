"use client";
import { CheckCircle2, Copy, KeyRound, Mail, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { PageHeader, Panel, Toggle } from "@/components/ui";
import { useI18n } from "@/i18n/provider";

export function AccountClient({ envInfo }: { envInfo:{hasPassword:boolean; authType:string; version:string}}){
  const { t, locale } = useI18n();
  const tabs = [
    { key: "profile", label: t("account.profile") },
    { key: "security", label: t("account.security") },
    { key: "sessions", label: t("account.sessions") },
  ] as const;
  type TabKey = typeof tabs[number]["key"];
  const [tab,setTab]=useState<TabKey>("profile");
  return <div className="workspace-page"><PageHeader title={t("account.title")} description={t("account.description")}/>
    <div className="account-shell"><div className="account-card"><div className="account-avatar"><UserRound size={34}/></div><div><h2>Admin User</h2><p>admin@salesgate.local</p><span><CheckCircle2 size={13}/>{locale === "en" ? `Admin · v${envInfo.version}` : `管理者 · v${envInfo.version}`}</span></div></div><div className="account-tabs">{tabs.map((item)=>(
      <button key={item.key} className={tab===item.key?"active":""} onClick={()=>setTab(item.key)}>{item.label}</button>
    ))}</div>
      {tab==="profile"? <Panel className="account-panel"><div className="account-section-head"><UserRound size={18}/><div><h3>{t("account.profileTitle")}</h3><p>{t("account.profileDesc")}</p></div></div><div className="form-grid"><label>{t("account.displayName")}<input defaultValue="Admin User" readOnly style={{opacity:0.7}}/></label><label>{t("account.role")}<input defaultValue={locale === "en" ? "Admin" : "管理者"} readOnly style={{opacity:0.7}}/></label><label className="full">{t("account.email")}<div className="input-with-icon"><Mail size={14}/><input defaultValue="admin@salesgate.local" readOnly style={{opacity:0.7}}/></div></label></div><div className="modal-info" style={{margin:"13px 14px"}}>{t("account.readOnlyNote")}</div><div className="account-panel-actions"><button className="btn ghost" disabled>{t("account.saveComing")}</button></div></Panel>:null}
      {tab==="security"? <Panel className="account-panel"><div className="account-section-head"><ShieldCheck size={18}/><div><h3>{t("account.securityTitle")}</h3><p>{t("account.securityDesc")}</p></div></div><div className="setting-row"><div><strong>{t("account.password")}</strong><p>{envInfo.hasPassword? t("account.passwordConfigured"):t("account.passwordNotConfigured")}</p></div><Toggle checked={envInfo.hasPassword} onChange={()=>alert(t("settings.humanApprovalCannotChange"))} label={t("account.password")}/></div><div className="setting-row"><div><strong>{t("account.authType")}</strong><p>{envInfo.authType}</p></div><span style={{fontSize:10, color:"#7f90a7"}}>{envInfo.hasPassword? t("health.configured"):t("health.notConfigured")}</span></div><div className="security-box"><div><KeyRound size={17}/><span><strong>{t("account.token")}</strong><small>{t("account.tokenNotAvailable")}</small></span></div><code>—</code><button className="icon-btn" disabled><Copy size={15}/></button></div><div className="modal-info" style={{margin:"0 14px 14px"}}>{t("account.comingSoon")}</div></Panel>:null}
      {tab==="sessions"? <Panel className="account-panel"><div className="account-section-head"><MonitorSmartphone size={18}/><div><h3>{t("account.sessionsTitle")}</h3><p>{t("account.sessionsDesc")}</p></div></div><div className="empty-state" style={{minHeight:160,padding:20}}><strong>{t("account.noSessions")}</strong><span>{t("account.noSessionsDesc")}</span></div></Panel>:null}
    </div>
  </div>;
}
