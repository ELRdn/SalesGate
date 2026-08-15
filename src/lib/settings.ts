// アプリ設定のヘルパー
import { prisma } from "./prisma.ts";

/** 設定値を整数で取得（未設定・不正ならフォールバック値） */
export async function getSettingInt(key: string, fallback: number): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key } });
  const v = s ? Number.parseInt(s.value, 10) : Number.NaN;
  return Number.isFinite(v) ? v : fallback;
}

/** 設定値を文字列で取得 */
export async function getSetting(key: string, fallback: string): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}
