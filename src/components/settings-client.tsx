"use client";
import { BellRing, Database, Gauge, KeyRound, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Panel, Toggle } from "@/components/ui";
import { updateSettings } from "@/lib/actions";

export function SettingsClient({ initialSettings, envInfo }: { initialSettings: Record<string,string>; envInfo:{databaseUrl:string; mcpEndpoint:string; hasPassword:boolean; authType:string}}){
  const [dailyLimit,setDailyLimit]=useState(initialSettings["daily_send_limit"]??"50");
  const [followupDays,setFollowupDays]=useState(initialSettings["followup_delay_days"]??"3");
  const [maxFollowups,setMaxFollowups]=useState(initialSettings["max_touches"]??"3");
  const [archiveDays,setArchiveDays]=useState(initialSettings["archive_after_days"]??"7");
  const [slackUrl,setSlackUrl]=useState(initialSettings["slack_webhook_url"]??"");
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
        });
        setMsg("設定を保存しました");
        router.refresh();
        setTimeout(()=>setMsg(null),3000);
      }catch(e){ setMsg(e instanceof Error?e.message:"保存に失敗しました"); }
    });
  };
  return <div className="workspace-page settings-page"><PageHeader title="設定" description="SalesGateの送信ガードレール、通知、セキュリティ、データ管理を構成します。" action={<button className="btn primary" onClick={handleSave} disabled={isPending}><Save size={15}/>{isPending?"保存中...":"変更を保存"}</button>}/>
    {msg? <div className="modal-info" style={{marginBottom:12}}>{msg}</div>:null}
    <div className="settings-layout"><nav className="settings-nav"><a href="#sending"><Send size={15}/>送信ガバナンス</a><a href="#followup"><RefreshCw size={15}/>フォローアップ</a><a href="#notifications"><BellRing size={15}/>通知</a><a href="#security"><ShieldCheck size={15}/>セキュリティ</a><a href="#data"><Database size={15}/>データ</a></nav><div className="settings-content">
      <Panel className="settings-section"><div id="sending" className="settings-title"><div className="settings-icon blue"><Gauge size={18}/></div><div><h2>送信ガバナンス</h2><p>エージェントが扱える送信量と承認ルールを制御します。</p></div></div><SettingRow label="日次送信上限" description="すべてのエージェント合計。上限到達後は新しいclaimを停止します。"><div className="number-input"><button onClick={()=>setDailyLimit(String(Math.max(1,parseInt(dailyLimit||"50",10)-5)))}>−</button><input value={dailyLimit} onChange={(e)=>setDailyLimit(e.target.value)}/><button onClick={()=>setDailyLimit(String(parseInt(dailyLimit||"50",10)+5))}>＋</button><span>件 / 日</span></div></SettingRow><SettingRow label="人間承認を必須にする" description="SalesGateのコア原則。無効化できません。"><Toggle checked={true} onChange={()=>alert("この設定は変更できません")} label="人間承認"/></SettingRow><SettingRow label="7日放置で自動アーカイブ" description="未処理の承認アイテムを自動的にアーカイブします。"><div className="inline-field"><input type="number" value={archiveDays} onChange={(e)=>setArchiveDays(e.target.value)}/><span>日</span></div></SettingRow></Panel>
      <Panel className="settings-section"><div id="followup" className="settings-title"><div className="settings-icon violet"><RefreshCw size={18}/></div><div><h2>フォローアップ</h2><p>未返信リードに対するタスク生成ルール。</p></div></div><SettingRow label="待機期間" description="初回送信から次のフォローアップ候補を生成するまで。"><div className="inline-field"><input type="number" value={followupDays} onChange={(e)=>setFollowupDays(e.target.value)}/><span>日</span></div></SettingRow><SettingRow label="最大フォローアップ回数" description="上限到達後はリードを休眠状態にします。"><div className="inline-field"><input type="number" value={maxFollowups} onChange={(e)=>setMaxFollowups(e.target.value)}/><span>回</span></div></SettingRow></Panel>
      <Panel className="settings-section"><div id="notifications" className="settings-title"><div className="settings-icon green"><Database size={18}/></div><div><h2>通知</h2><p>承認待ちや重大なリスクを外部へ通知します。</p></div></div><SettingRow label="Slack通知" description="新しい承認待ちが作成されたときWebhookへ通知。"><Toggle checked={!!slackUrl} onChange={()=>{}} label="Slack通知"/></SettingRow><div className="setting-input-block"><label>Slack Webhook URL</label><div className="masked-input"><input type="text" value={slackUrl} onChange={(e)=>setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..."/><button onClick={()=>alert(slackUrl?"Webhookが設定されています":"未設定です")}>テスト</button></div><small style={{color:"#7f90a7",fontSize:9}}>空の場合は通知無効</small></div></Panel>
      <Panel className="settings-section"><div id="security" className="settings-title"><div className="settings-icon amber"><KeyRound size={18}/></div><div><h2>セキュリティ</h2><p>ローカル・外部公開時のアクセス制御。</p></div></div><SettingRow label="パスワード認証" description={envInfo.authType}><Toggle checked={envInfo.hasPassword} onChange={()=>alert("SALESGATE_PASSWORD は環境変数で設定してください。Restart required")} label="パスワード認証"/></SettingRow><SettingRow label="MCP Endpoint" description="エージェントが接続するStreamable HTTP endpoint。"><code className="endpoint-code">{envInfo.mcpEndpoint}</code></SettingRow><SettingRow label="Database" description="SQLite 永続化先"><code className="endpoint-code">{envInfo.databaseUrl}</code></SettingRow></Panel>
      <Panel className="settings-section"><div id="data" className="settings-title"><div className="settings-icon red"><Database size={18}/></div><div><h2>データ管理</h2><p>SQLiteデータと監査ログのエクスポート。</p></div></div><div className="data-actions"><button className="btn ghost" onClick={()=>window.location.href="/api/export/logs"}>監査ログをエクスポート</button><button className="btn ghost" onClick={()=>window.location.href="/api/export/playbook"}>プレイブックをエクスポート</button></div><p style={{padding:"0 14px 14px",color:"#7f90a7",fontSize:10}}>Environment variableで管理される設定は read-only / Restart required として表示されます。</p></Panel>
    </div></div>
  </div>;
}
function SettingRow({label,description,children}:{label:string;description:string;children:React.ReactNode}){return <div className="setting-row"><div><strong>{label}</strong><p>{description}</p></div><div>{children}</div></div>;}
