// 通知ヘルパー（Slack Webhook）
// 設定の slack_webhook_url が空なら何もしない（通知無効）
import { prisma } from "./prisma.ts";

/**
 * Slackへ通知を送信する。Webhook URL未設定・送信失敗時は false を返す（呼び出し側は握りつぶして良い）
 */
export async function sendSlackNotification(title: string, text: string): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { key: "slack_webhook_url" } });
  const url = s?.value?.trim();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: title ? `*${title}*\n${text}` : text,
        mrkdwn: true,
      }),
    });
    return res.ok;
  } catch {
    return false; // 通知の失敗はアプリの動作に影響させない
  }
}
