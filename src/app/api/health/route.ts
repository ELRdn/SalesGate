import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "disconnected" = "connected";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "disconnected";
  }

  const hasPassword = !!process.env.SALESGATE_PASSWORD;
  let slack: "configured" | "notConfigured" = "notConfigured";
  try {
    const s = await prisma.setting.findUnique({ where: { key: "slack_webhook_url" } });
    if (s?.value) slack = "configured";
  } catch {}

  return Response.json({
    database,
    mcpServer: "ready" as const,
    authentication: hasPassword ? ("enabled" as const) : ("disabled" as const),
    slack,
    scheduler: "ready" as const,
  });
}
