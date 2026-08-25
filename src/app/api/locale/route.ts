import { prisma } from "@/lib/prisma";
import { isValidLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const locale = body.locale;
    if (!isValidLocale(locale)) return Response.json({ error: "invalid locale" }, { status: 400 });
    await prisma.setting.upsert({
      where: { key: "ui.defaultLocale" },
      update: { value: locale },
      create: { key: "ui.defaultLocale", value: locale },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
