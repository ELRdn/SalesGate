import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, LOCALE_COOKIE, type Locale } from "./config";
import { prisma } from "@/lib/prisma";

// 優先順位: 1. cookie 2. Setting ui.defaultLocale 3. Accept-Language 4. en
export async function getLocale(): Promise<Locale> {
  // 1. cookie
  try {
    const ck = await cookies();
    const v = ck.get(LOCALE_COOKIE)?.value;
    if (v && isValidLocale(v)) return v;
  } catch {}

  // 2. Setting
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ui.defaultLocale" } });
    if (s?.value && isValidLocale(s.value)) return s.value as Locale;
  } catch {}

  // 3. Accept-Language
  try {
    const h = await headers();
    const al = h.get("accept-language") ?? "";
    // 簡易パース: 最初の ja が en より前にあれば ja
    const lower = al.toLowerCase();
    if (lower.includes("ja")) {
      // "ja" が含まれれば ja を優先（ただし en が先頭なら en を返すロジックも可能だが、海外向けデフォルト en のため ja 明示時のみ ja）
      // 例: "ja,en;q=0.9" → ja, "en,ja" → ja でも en デフォルトポリシーでは en が欲しいが、ブラウザが ja を明示しているなら尊重
      // シンプルに ja が含まれれば ja
      return "ja";
    }
  } catch {}

  return DEFAULT_LOCALE;
}

export async function getLocaleSettings(): Promise<{
  locale: Locale;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
}> {
  const locale = await getLocale();
  let timeZone = "auto";
  let dateFormat = "locale";
  let timeFormat = "auto";
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["ui.timeZone", "ui.dateFormat", "ui.timeFormat"] } },
    });
    for (const r of rows) {
      if (r.key === "ui.timeZone") timeZone = r.value;
      if (r.key === "ui.dateFormat") dateFormat = r.value;
      if (r.key === "ui.timeFormat") timeFormat = r.value;
    }
  } catch {}
  return { locale, timeZone, dateFormat, timeFormat };
}
