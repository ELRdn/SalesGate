import type { Approval, Lead, Task } from "@/types";

export const initialApprovals: Approval[] = [
  { id: 1, company: "株式会社Tech Solutions", person: "山田 太郎 様", email: "yamada@tech-sol.co.jp", agent: "DSH", subject: "SalesGate のご紹介について", body: "山田様\n\n突然のご連絡失礼いたします。貴社の採用ページとDX推進に関する発信を拝見し、営業オペレーションの効率化でお役に立てる可能性があると考えご連絡しました。\n\nもしご関心があれば、5分ほどで概要をご共有できます。", note: "初回接触 / Web調査・採用事例", evidence: "採用ページで営業組織拡大を確認。直近のブログで「営業活動の標準化」を課題として言及。", risk: "低リスク", time: "2時間前", status: "承認待ち" },
  { id: 2, company: "株式会社Next Innovation", person: "鈴木 花子 様", email: "suzuki@next-innov.co.jp", agent: "OpenClaw", subject: "フォローアップのご連絡", body: "鈴木様\n\n先日お送りした件につき、補足資料を1点だけ共有したくご連絡しました。\n\nご不要でしたら返信不要です。ご興味があれば資料のみお送りします。", note: "フォローアップ #1 / 3日前にメール送信済み", evidence: "3日前に初回メール送信。開封記録あり、返信は未確認。", risk: "中リスク", time: "5時間前", status: "承認待ち" },
  { id: 3, company: "株式会社Growth Partners", person: "佐藤 健一 様", email: "sato@growth-partners.co.jp", agent: "Claude Code", subject: "事例資料のご送付", body: "佐藤様\n\n先週ご覧いただいた資料に近い事例をまとめました。もし比較検討の材料になればと思い、ご連絡いたしました。\n\n必要でしたらそのままお送りします。", note: "フォローアップ #2 / 先週資料請求あり", evidence: "問い合わせフォームから資料請求履歴あり。送付希望カテゴリと今回の資料テーマが一致。", risk: "低リスク", time: "1日前", status: "承認待ち" },
  { id: 4, company: "株式会社Digital First", person: "田中 美咲 様", email: "tanaka@digital-first.jp", agent: "DSH", subject: "SalesGateで営業を効率化しませんか？", body: "田中様\n\n貴社の営業体制について拝見し、AIエージェントを活用した営業効率化をご提案したくご連絡しました。\n\n同業他社でも成果が出ております。", note: "初回接触 / 類似企業での導入事例", evidence: "公式サイトと採用情報を確認。ただし「同業他社でも成果」の根拠URLが未添付。", risk: "高リスク", time: "1日前", status: "承認待ち" },
  { id: 5, company: "株式会社Cloud Works", person: "伊藤 翔 様", email: "ito@cloud-works.co.jp", agent: "Codex", subject: "ご提案資料の送付について", body: "伊藤様\n\n先日のご連絡に関連して、より具体的な運用イメージを1枚にまとめました。\n\nご希望でしたらこちらでお送りします。", note: "フォローアップ #3 / 2日前にメール送信済み", evidence: "過去2回接触済み。今回が設定上限の3回目。", risk: "中リスク", time: "2日前", status: "承認待ち" },
  { id: 6, company: "株式会社Vector Labs", person: "小林 翼 様", email: "kobayashi@vector-labs.jp", agent: "OpenClaw", subject: "資料送付の件", body: "小林様\n\nご依頼の資料をお送りします。", note: "資料送付", evidence: "返信で資料送付希望を受領。", risk: "低リスク", time: "3日前", status: "承認済み" },
  { id: 7, company: "合同会社Orbit", person: "森 彩 様", email: "mori@orbit.jp", agent: "Codex", subject: "ご連絡ありがとうございます", body: "森様\n\n先ほどの内容を修正してお送りします。", note: "人間編集済み", evidence: "担当者が件名とCTAを修正。", risk: "低リスク", time: "4日前", status: "編集承認済み" },
  { id: 8, company: "株式会社Nova Sales", person: "中村 徹 様", email: "nakamura@nova-sales.jp", agent: "DSH", subject: "再送信テスト", body: "中村様\n\n送信エラーのため再送予定です。", note: "送信失敗 / SMTP一時エラー", evidence: "前回送信時に一時的な接続エラー。", risk: "中リスク", time: "5日前", status: "送信失敗" },
];

export const leads: Lead[] = [
  { id: 1, company: "株式会社Tech Solutions", person: "山田 太郎", email: "yamada@tech-sol.co.jp", status: "アクティブ", agent: "DSH", touches: 1, lastTouch: "2時間前", nextAction: "承認待ち" },
  { id: 2, company: "株式会社Next Innovation", person: "鈴木 花子", email: "suzuki@next-innov.co.jp", status: "アクティブ", agent: "OpenClaw", touches: 2, lastTouch: "3日前", nextAction: "フォローアップ" },
  { id: 3, company: "株式会社Growth Partners", person: "佐藤 健一", email: "sato@growth-partners.co.jp", status: "返信あり", agent: "Claude Code", touches: 3, lastTouch: "1日前", nextAction: "資料送付" },
  { id: 4, company: "株式会社Digital First", person: "田中 美咲", email: "tanaka@digital-first.jp", status: "アクティブ", agent: "DSH", touches: 1, lastTouch: "1日前", nextAction: "リスク確認" },
  { id: 5, company: "株式会社Cloud Works", person: "伊藤 翔", email: "ito@cloud-works.co.jp", status: "休眠", agent: "Codex", touches: 3, lastTouch: "14日前", nextAction: "休眠" },
  { id: 6, company: "株式会社Atlas", person: "吉田 海", email: "yoshida@atlas.jp", status: "抑制中", agent: "OpenClaw", touches: 1, lastTouch: "21日前", nextAction: "送信禁止" },
];

export const tasks: Task[] = [
  { id: 1, title: "Tech Solutions向け初回メール確認", company: "株式会社Tech Solutions", type: "初回営業", status: "進行中", agent: "DSH", due: "今日 15:00", priority: "高" },
  { id: 2, title: "Next Innovation フォローアップ", company: "株式会社Next Innovation", type: "フォローアップ", status: "未着手", agent: "OpenClaw", due: "今日 17:00", priority: "高" },
  { id: 3, title: "Growth Partners 商談準備", company: "株式会社Growth Partners", type: "商談準備", status: "進行中", agent: "Claude Code", due: "明日 10:00", priority: "中" },
  { id: 4, title: "Cloud Works 見積たたき台", company: "株式会社Cloud Works", type: "見積", status: "未着手", agent: "Codex", due: "8/20", priority: "中" },
  { id: 5, title: "Orbit 契約条件確認", company: "合同会社Orbit", type: "契約", status: "期限超過", agent: "DSH", due: "昨日 18:00", priority: "高" },
  { id: 6, title: "Vector Labs 送付後ログ確認", company: "株式会社Vector Labs", type: "フォローアップ", status: "完了", agent: "OpenClaw", due: "完了", priority: "低" },
];

export const sendHistory = [
  { id: 1, company: "株式会社Test Corp.", email: "sales@test-corp.jp", subject: "AI営業運用のご提案", agent: "DSH" as const, status: "送信済み", sentAt: "今日 13:48", messageId: "<sg-98af@test>", hash: "一致" },
  { id: 2, company: "株式会社Sample", email: "hello@sample.jp", subject: "資料送付のご案内", agent: "OpenClaw" as const, status: "送信済み", sentAt: "今日 12:03", messageId: "<sg-91bd@sample>", hash: "一致" },
  { id: 3, company: "株式会社Legacy", email: "contact@legacy.jp", subject: "フォローアップ", agent: "Codex" as const, status: "送信失敗", sentAt: "今日 10:26", messageId: "—", hash: "未検証" },
  { id: 4, company: "株式会社North", email: "biz@north.jp", subject: "導入事例の共有", agent: "Claude Code" as const, status: "送信済み", sentAt: "昨日 18:11", messageId: "<sg-75ca@north>", hash: "一致" },
  { id: 5, company: "株式会社Edge", email: "team@edge.jp", subject: "サービスご紹介", agent: "DSH" as const, status: "本文不一致", sentAt: "昨日 16:42", messageId: "<sg-63ad@edge>", hash: "不一致" },
];

export const suppressionEntries = [
  { id: 1, email: "test@example.com", reason: "配信停止依頼", source: "受信メール", added: "2026/08/18", owner: "Admin User" },
  { id: 2, email: "contact@atlas.jp", reason: "重複・手動抑制", source: "管理画面", added: "2026/08/14", owner: "Admin User" },
  { id: 3, email: "legal@sample.co.jp", reason: "コンプライアンス", source: "CSV Import", added: "2026/08/10", owner: "System" },
];

export const playbooks = [
  { id: 1, name: "B2B SaaS 初回営業", version: "v1.4", description: "個別観察から入り、抵抗の少ないCTAへつなぐ標準プレイブック。", status: "適用中", updated: "2日前", rules: 12 },
  { id: 2, name: "3ステップ Follow-up", version: "v1.1", description: "3日間隔・最大3回。返信なしの場合は自動で休眠化。", status: "利用可能", updated: "5日前", rules: 8 },
  { id: 3, name: "高リスク業界レビュー", version: "v0.9", description: "未検証表現やコンプライアンス表現を厳格にレビュー。", status: "下書き", updated: "1週間前", rules: 15 },
];
