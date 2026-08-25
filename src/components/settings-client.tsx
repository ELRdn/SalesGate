"use client";
import { BellRing, Database, Gauge, Globe, KeyRound, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Panel, Toggle } from "@/components/ui";
import { updateSettings } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/i18n/config";
import { AboutPanel } from "@/components/about";

export function SettingsClient({ initialSettings, envInfo }: { initialSettings: Record<string,string>; envInfo:{databaseUrl:string; mcpEndpoint:string; hasPassword:boolean; authType:string}}){
  const { t } = useI18n();
  const [dailyLimit,setDailyLimit]=useState(initialSettings["daily_send_limit"]??"50");
  const [followupDays,setFollowupDays]=useState(initialSettings["followup_delay_days"]??"3");
  const [maxFollowups,setMaxFollowups]=useState(initialSettings["max_touches"]??"3");
  const [archiveDays,setArchiveDays]=useState(initialSettings["archive_after_days"]??"7");
  const [slackUrl,setSlackUrl]=useState(initialSettings["slack_webhook_url"]??"");
  const [language,setLanguage]=useState(initialSettings["ui.defaultLocale"]??initialSettings["language"]??"en");
  const [timeZone,setTimeZone]=useState(initialSettings["ui.timeZone"]??initialSettings["timeZone"]??"auto");
  const [dateFormat,setDateFormat]=useState(initialSettings["ui.dateFormat"]??initialSettings["dateFormat"]??"locale");
  const [timeFormat,setTimeFormat]=useState(initialSettings["ui.timeFormat"]??initialSettings["timeFormat"]??"auto");
  const [isPending,startTransition]=useTransition();
  const router=useRouter();
  const [msg,setMsg]=useState<string|null>(null);
  const handleSave=()=>{
    setMsg(null);
    startTransition(async()=>{
      try{
        await updateSettings({
          daily_send_limit: dailyLimit,
          followup_delay_days: followupDays,
          max_touches: maxFollowups,
          archive_after_days: archiveDays,
          slack_webhook_url: slackUrl,
          "ui.defaultLocale": language,
          "ui.timeZone": timeZone,
          "ui.dateFormat": dateFormat,
          "ui.timeFormat": timeFormat,
        });
        // persist locale to cookie for immediate effect
        try{
          document.cookie = `${LOCALE_COOKIE}=${language}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
        }catch{}
        setMsg(t("settings.saved"));
        router.refresh();
        setTimeout(()=>setMsg(null),3000);
      }catch(e){ setMsg(e instanceof Error?e.message:t("settings.saveFailed")); }
    });
  };
  return <div className="workspace-page settings-page"><PageHeader title={t("settings.title")} description={t("settings.description")} action={<button className="btn primary" onClick={handleSave} disabled={isPending}><Save size={15}/>{isPending?t("settings.saving"):t("settings.save")}</button>}/>
    {msg? <div className="modal-info" style={{marginBottom:12}}>{msg}</div>:null}
    <div className="settings-layout"><nav className="settings-nav"><a href="#general"><Globe size={15}/>{t("settings.general")}</a><a href="#sending"><Send size={15}/>{t("settings.sending")}</a><a href="#followup"><RefreshCw size={15}/>{t("settings.followups")}</a><a href="#notifications"><BellRing size={15}/>{t("settings.notifications")}</a><a href="#security"><ShieldCheck size={15}/>{t("settings.security")}</a><a href="#data"><Database size={15}/>{t("settings.data")}</a></nav><div className="settings-content">
      <Panel className="settings-section"><div id="general" className="settings-title"><div className="settings-icon blue"><Globe size={18}/></div><div><h2>{t("settings.generalTitle")}</h2><p>{t("settings.generalDesc")}</p><span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#0f2b1a", color:"#86efac", border:"1px solid #1a4d2e"}}>DB • Editable</span></div></div>
        <SettingRow label={t("settings.language")} description={t("settings.languageDesc")}><select value={language} onChange={(e)=>{ const v=e.target.value; setLanguage(v); try{ document.cookie=`${LOCALE_COOKIE}=${v}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`; fetch("/api/locale",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({locale:v})}); }catch{} }} style={{minWidth:160, padding:"6px 8px", borderRadius:6, border:"1px solid #33465a", background:"#0f1c2b", color:"#dfe8f3", fontSize:11}}><option value="en">English</option><option value="ja">日本語</option></select></SettingRow>
        <SettingRow label={t("settings.timeZone")} description={t("settings.timeZoneDesc")}><select value={timeZone} onChange={(e)=>setTimeZone(e.target.value)} style={{minWidth:160, padding:"6px 8px", borderRadius:6, border:"1px solid #33465a", background:"#0f1c2b", color:"#dfe8f3", fontSize:11}}><option value="auto">{t("settings.auto")}</option><option value="UTC">UTC</option><option value="Asia/Tokyo">Asia/Tokyo</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option><option value="Australia/Sydney">Australia/Sydney</option></select></SettingRow>
        <SettingRow label={t("settings.dateFormat")} description={t("settings.dateFormatDesc")}><select value={dateFormat} onChange={(e)=>setDateFormat(e.target.value)} style={{minWidth:160, padding:"6px 8px", borderRadius:6, border:"1px solid #33465a", background:"#0f1c2b", color:"#dfe8f3", fontSize:11}}><option value="locale">{t("settings.localeDefault")}</option><option value="YYYY/MM/DD">YYYY/MM/DD</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option></select></SettingRow>
        <SettingRow label={t("settings.timeFormat")} description={t("settings.timeFormatDesc")}><select value={timeFormat} onChange={(e)=>setTimeFormat(e.target.value)} style={{minWidth:160, padding:"6px 8px", borderRadius:6, border:"1px solid #33465a", background:"#0f1c2b", color:"#dfe8f3", fontSize:11}}><option value="auto">{t("settings.auto")}</option><option value="24-hour">{t("settings.hour24")}</option><option value="12-hour">{t("settings.hour12")}</option></select></SettingRow>
        <small style={{color:"#7f90a7",fontSize:9, padding:"0 14px 10px", display:"block"}}>DB-backed: 0件でも編集可能。保存時にupsertで作成。</small>
      </Panel>
      <Panel className="settings-section"><div id="sending" className="settings-title"><div className="settings-icon blue"><Gauge size={18}/></div><div><h2>{t("settings.sendingTitle")}</h2><p>{t("settings.sendingDesc")}</p><span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#0f2b1a", color:"#86efac", border:"1px solid #1a4d2e"}}>DB • Editable</span></div></div><SettingRow label={t("settings.dailyLimit")} description={t("settings.dailyLimitDesc")}><div className="number-input"><button type="button" onClick={()=>setDailyLimit(String(Math.max(1,parseInt(dailyLimit||"50",10)-5)))}>−</button><input value={dailyLimit} onChange={(e)=>setDailyLimit(e.target.value)}/><button type="button" onClick={()=>setDailyLimit(String(parseInt(dailyLimit||"50",10)+5))}>＋</button><span>{t("settings.perDay")}</span></div></SettingRow><SettingRow label={t("settings.humanApproval")} description={t("settings.humanApprovalDesc")}><Toggle checked={true} onChange={()=>alert(t("settings.humanApprovalCannotChange"))} label={t("settings.humanApproval")}/></SettingRow><SettingRow label={t("settings.autoArchive")} description={t("settings.autoArchiveDesc")}><div className="inline-field"><input type="number" value={archiveDays} onChange={(e)=>setArchiveDays(e.target.value)}/><span>{t("settings.days")}</span></div></SettingRow>
        <small style={{color:"#7f90a7",fontSize:9, padding:"0 14px 10px", display:"block"}}>DB-backed: 保存時にupsert。</small>
      </Panel>
      <Panel className="settings-section"><div id="followup" className="settings-title"><div className="settings-icon violet"><RefreshCw size={18}/></div><div><h2>{t("settings.followupsTitle")}</h2><p>{t("settings.followupsDesc")}</p><span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#0f2b1a", color:"#86efac", border:"1px solid #1a4d2e"}}>DB • Editable</span></div></div><SettingRow label={t("settings.waitPeriod")} description={t("settings.waitPeriodDesc")}><div className="inline-field"><input type="number" value={followupDays} onChange={(e)=>setFollowupDays(e.target.value)}/><span>{t("settings.days")}</span></div></SettingRow><SettingRow label={t("settings.maxFollowups")} description={t("settings.maxFollowupsDesc")}><div className="inline-field"><input type="number" value={maxFollowups} onChange={(e)=>setMaxFollowups(e.target.value)}/><span>{t("settings.times")}</span></div></SettingRow>
        <small style={{color:"#7f90a7",fontSize:9, padding:"0 14px 10px", display:"block"}}>DB-backed: 0件でも編集可能。</small>
      </Panel>
      <Panel className="settings-section"><div id="notifications" className="settings-title"><div className="settings-icon green"><Database size={18}/></div><div><h2>{t("settings.notificationsTitle")}</h2><p>{t("settings.notificationsDesc")}</p><span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#0f2b1a", color:"#86efac", border:"1px solid #1a4d2e"}}>DB • Editable</span></div></div><SettingRow label={t("settings.slack")} description={t("settings.slackDesc")}><Toggle checked={!!slackUrl} onChange={()=>{}} label={t("settings.slack")}/></SettingRow><div className="setting-input-block"><label>{t("settings.slackUrl")}</label><div className="masked-input"><input type="text" value={slackUrl} onChange={(e)=>setSlackUrl(e.target.value)} placeholder={t("settings.slackUrlPlaceholder")}/><button type="button" onClick={()=>alert(slackUrl?t("settings.slackConfigured"):t("settings.slackNotConfigured"))}>{t("settings.slackTest")}</button></div><small style={{color:"#7f90a7",fontSize:9}}>{t("settings.emptyMeansDisabled")}</small></div></Panel>
      <Panel className="settings-section"><div id="security" className="settings-title"><div className="settings-icon amber"><KeyRound size={18}/></div><div><h2>{t("settings.securityTitle")}</h2><p>{t("settings.securityDesc")}</p><span style={{fontSize:9, padding:"2px 6px", borderRadius:4, background:"#2b1a0f", color:"#fbbf24", border:"1px solid #4d2e1a"}}>Env • Read-only</span></div></div><SettingRow label={t("settings.passwordAuth")} description={envInfo.authType}><Toggle checked={envInfo.hasPassword} onChange={()=>alert(t("settings.envReadOnly"))} label={t("settings.passwordAuth")}/></SettingRow><SettingRow label={t("settings.mcpEndpoint")} description={t("settings.mcpEndpointDesc")}><code className="endpoint-code">{envInfo.mcpEndpoint}</code></SettingRow><SettingRow label={t("settings.database")} description={t("settings.databaseDesc")}><code className="endpoint-code">{envInfo.databaseUrl}</code></SettingRow>
        <small style={{color:"#b45309",fontSize:9, padding:"0 14px 10px", display:"block"}}>Environment-backed: .env / process.env で管理。UIからは変更不可。</small>
      </Panel>
      <Panel className="settings-section"><div id="data" className="settings-title"><div className="settings-icon red"><Database size={18}/></div><div><h2>{t("settings.dataTitle")}</h2><p>{t("settings.dataDesc")}</p></div></div><div className="data-actions"><button className="btn ghost" onClick={()=>window.location.href="/api/export/logs"}>{t("settings.exportLogs")}</button><button className="btn ghost" onClick={()=>window.location.href="/api/export/playbook"}>{t("settings.exportPlaybook")}</button></div><p style={{padding:"0 14px 14px",color:"#7f90a7",fontSize:10}}>{t("settings.envReadOnly")}</p></Panel>
      <AboutPanel />
    </div></div>
  </div>;
}
function SettingRow({label,description,children}:{label:string;description:string;children:React.ReactNode}){return <div className="setting-row"><div><strong>{label}</strong><p>{description}</p></div><div>{children}</div></div>;}
