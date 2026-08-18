// v2 UI タイプ定義
// バックエンドの types（src/lib/serialize.ts 等）とは独立

export type PageKey = "ダッシュボード" | "承認キュー" | "リード" | "タスク" | "送信履歴" | "抑制リスト" | "プレイブック" | "設定" | "アカウント";
export type Risk = "低リスク" | "中リスク" | "高リスク";
export type Agent = "DSH" | "OpenClaw" | "Claude Code" | "Codex";
export type ApprovalStatus = "承認待ち" | "承認済み" | "編集承認済み" | "却下" | "送信失敗" | "送信済み";

export type Approval = {
  id: number;
  company: string;
  person: string;
  email: string;
  agent: Agent;
  subject: string;
  body: string;
  note: string;
  evidence: string;
  risk: Risk;
  time: string;
  status: ApprovalStatus;
};

export type Lead = {
  id: number;
  company: string;
  person: string;
  email: string;
  status: "アクティブ" | "返信あり" | "休眠" | "抑制中";
  agent: Agent;
  touches: number;
  lastTouch: string;
  nextAction: string;
};

export type Task = {
  id: number;
  title: string;
  company: string;
  type: "初回営業" | "フォローアップ" | "商談準備" | "見積" | "契約";
  status: "未着手" | "進行中" | "完了" | "期限超過";
  agent: Agent;
  due: string;
  priority: "高" | "中" | "低";
};
