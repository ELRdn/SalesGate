import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings-client";
export const dynamic = "force-dynamic";
export default async function SettingsPage(){
  const settings = await prisma.setting.findMany();
  const map: Record<string,string> = {};
  for(const s of settings) map[s.key]=s.value;
  const envInfo = {
    databaseUrl: process.env.DATABASE_URL ? "Configured" : "file:./prisma/dev.db",
    mcpEndpoint: "/mcp",
    hasPassword: !!process.env.SALESGATE_PASSWORD,
    authType: process.env.SALESGATE_PASSWORD ? "Basic Auth (SALESGATE_PASSWORD)" : "None (open)",
  };
  return <SettingsClient initialSettings={map} envInfo={envInfo} />;
}
