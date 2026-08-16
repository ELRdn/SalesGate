// プレイブック共有 — 設定をJSONパッケージとしてエクスポート／インポートする
// 既知の設定キー（数値4つ + 文字列1つ）
export const NUMERIC_SETTING_KEYS = [
  "daily_send_limit",
  "followup_delay_days",
  "max_touches",
  "archive_after_days",
] as const;

export const STRING_SETTING_KEYS = ["slack_webhook_url"] as const;

export const KNOWN_SETTING_KEYS = [...NUMERIC_SETTING_KEYS, ...STRING_SETTING_KEYS];

/** プレイブックJSONの型定義 */
export interface PlaybookContent {
  name: string;
  description?: string;
  version?: string;
  settings: Record<string, string>; // 既知の設定キーのみ
}

export type ValidatePlaybookResult =
  | { ok: true; content: PlaybookContent }
  | { ok: false; error: string };

/** 数値設定キーが数値変換可能で非負の整数であるかを判定 */
export function isValidNumericSettingValue(raw: string): boolean {
  const num = Number.parseInt(raw, 10);
  return Number.isFinite(num) && num >= 0;
}

/**
 * プレイブックJSONを検証する。
 * - JSONとしてパースできること
 * - name が必須
 * - settings がオブジェクト
 * - キーが既知のもののみ
 * - 数値キーは数値に変換できること
 */
export function validatePlaybook(jsonText: string): ValidatePlaybookResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSONとしてパースできません" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "プレイブックはオブジェクトである必要があります" };
  }

  const obj = parsed as Record<string, unknown>;

  const name = obj.name;
  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false, error: "name は必須です（空文字は不可）" };
  }

  if (obj.settings === undefined || typeof obj.settings !== "object" || obj.settings === null) {
    return { ok: false, error: "settings はオブジェクトである必要があります" };
  }

  const settings = obj.settings as Record<string, unknown>;

  for (const [key, value] of Object.entries(settings)) {
    if (!KNOWN_SETTING_KEYS.includes(key as (typeof KNOWN_SETTING_KEYS)[number])) {
      return { ok: false, error: `未知の設定キーです: ${key}` };
    }
    if (typeof value !== "string") {
      return { ok: false, error: `設定値は文字列である必要があります: ${key}` };
    }
    if ((NUMERIC_SETTING_KEYS as readonly string[]).includes(key)) {
      if (!isValidNumericSettingValue(value)) {
        return { ok: false, error: `数値設定の値が不正です: ${key}=${value}` };
      }
    }
  }

  const content: PlaybookContent = {
    name: name.trim(),
    description: typeof obj.description === "string" ? obj.description : undefined,
    version: typeof obj.version === "string" ? obj.version : undefined,
    settings: settings as Record<string, string>,
  };

  return { ok: true, content };
}

/** 現在の設定からプレイブックJSONを組み立てる */
export function buildPlaybookContent(settings: Record<string, string>): PlaybookContent {
  const known: Record<string, string> = {};
  for (const key of KNOWN_SETTING_KEYS) {
    const value = settings[key];
    if (value !== undefined && value !== null && value !== "") {
      known[key] = value;
    }
  }
  return {
    name: "SalesGate 設定プレイブック",
    version: "1.0.0",
    settings: known,
  };
}

/** プレイブックのcontent JSON文字列をPlaybookContentとしてパース（適用ロジック用） */
export function parsePlaybookContent(contentJson: string): PlaybookContent {
  const result = validatePlaybook(contentJson);
  if (!result.ok) {
    throw new Error(`保存済みプレイブックが不正です: ${result.error}`);
  }
  return result.content;
}
