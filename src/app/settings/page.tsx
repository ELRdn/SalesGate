"use client";

import { BellRing, Database, Gauge, KeyRound, RefreshCw, Save, Send, ShieldCheck, MessageSquare } from "lucide-react";
import { useState } from "react";
import { PageHeader, Panel, Toggle } from "@/components/ui";

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState(50);
  const [followupDays, setFollowupDays] = useState(3);
  const [maxFollowups, setMaxFollowups] = useState(3);
  const [slack, setSlack] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [autoArchive, setAutoArchive] = useState(true);
  const [passwordAuth, setPasswordAuth] = useState(true);

  return (
    <div className="workspace-page settings-page">
      <PageHeader title="設定" description="SalesGateの送信ガードレール、通知、セキュリティ、データ管理を構成します。" action={<button className="btn primary"><Save size={15} />変更を保存</button>} />
      <div className="settings-layout">
        <nav className="settings-nav">
          <a href="#sending"><Send size={15} />送信ガバナンス</a>
          <a href="#followup"><RefreshCw size={15} />フォローアップ</a>
          <a href="#notifications"><BellRing size={15} />通知</a>
          <a href="#security"><ShieldCheck size={15} />セキュリティ</a>
          <a href="#data"><Database size={15} />データ</a>
        </nav>
        <div className="settings-content">
          <Panel className="settings-section">
            <div id="sending" className="settings-title"><div className="settings-icon blue"><Gauge size={18} /></div><div><h2>送信ガバナンス</h2><p>エージェントが扱える送信量と承認ルールを制御します。</p></div></div>
            <SettingRow label="日次送信上限" description="すべてのエージェント合計。上限到達後は新しいclaimを停止します。">
              <div className="number-input">
                <button onClick={() => setDailyLimit(Math.max(1, dailyLimit - 5))}>−</button>
                <input value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
                <button onClick={() => setDailyLimit(dailyLimit + 5)}>＋</button>
                <span>件 / 日</span>
              </div>
            </SettingRow>
            <SettingRow label="人間承認を必須にする" description="SalesGateのコア原則。デモでは無効化できません。">
              <Toggle checked onChange={() => {}} label="人間承認" />
            </SettingRow>
            <SettingRow label="高リスク送信の警告" description="未検証の主張・重複・抑制候補を強調表示します。">
              <Toggle checked={riskAlerts} onChange={setRiskAlerts} label="高リスク送信の警告" />
            </SettingRow>
          </Panel>

          <Panel className="settings-section">
            <div id="followup" className="settings-title"><div className="settings-icon violet"><RefreshCw size={18} /></div><div><h2>フォローアップ</h2><p>未返信リードに対するタスク生成ルール。</p></div></div>
            <SettingRow label="待機期間" description="初回送信から次のフォローアップ候補を生成するまで。">
              <div className="inline-field"><input type="number" value={followupDays} onChange={(e) => setFollowupDays(Number(e.target.value))} /><span>日</span></div>
            </SettingRow>
            <SettingRow label="最大フォローアップ回数" description="上限到達後はリードを休眠状態にします。">
              <div className="inline-field"><input type="number" value={maxFollowups} onChange={(e) => setMaxFollowups(Number(e.target.value))} /><span>回</span></div>
            </SettingRow>
            <SettingRow label="7日放置で自動アーカイブ" description="未処理の承認アイテムを自動的にアーカイブします。">
              <Toggle checked={autoArchive} onChange={setAutoArchive} label="自動アーカイブ" />
            </SettingRow>
          </Panel>

          <Panel className="settings-section">
            <div id="notifications" className="settings-title"><div className="settings-icon green"><MessageSquare size={18} /></div><div><h2>通知</h2><p>承認待ちや重大なリスクを外部へ通知します。</p></div></div>
            <SettingRow label="Slack通知" description="新しい承認待ちが作成されたときWebhookへ通知。">
              <Toggle checked={slack} onChange={setSlack} label="Slack通知" />
            </SettingRow>
            <div className="setting-input-block">
              <label>Slack Webhook URL</label>
              <div className="masked-input">
                <input type="password" value="https://hooks.slack.com/services/T000/B000/••••••" readOnly />
                <button>テスト</button>
              </div>
            </div>
          </Panel>

          <Panel className="settings-section">
            <div id="security" className="settings-title"><div className="settings-icon amber"><KeyRound size={18} /></div><div><h2>セキュリティ</h2><p>ローカル・外部公開時のアクセス制御。</p></div></div>
            <SettingRow label="パスワード認証" description="SALESGATE_PASSWORD 設定時のBasic認証。">
              <Toggle checked={passwordAuth} onChange={setPasswordAuth} label="パスワード認証" />
            </SettingRow>
            <SettingRow label="MCP Endpoint" description="エージェントが接続するStreamable HTTP endpoint。">
              <code className="endpoint-code">http://localhost:3000/mcp</code>
            </SettingRow>
          </Panel>

          <Panel className="settings-section">
            <div id="data" className="settings-title"><div className="settings-icon red"><Database size={18} /></div><div><h2>データ管理</h2><p>SQLiteデータと監査ログのエクスポート。</p></div></div>
            <div className="data-actions">
              <button className="btn ghost">監査ログをエクスポート</button>
              <button className="btn ghost">DBバックアップを作成</button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return <div className="setting-row"><div><strong>{label}</strong><p>{description}</p></div><div>{children}</div></div>;
}
