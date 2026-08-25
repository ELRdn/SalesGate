import { AccountClient } from "@/components/account-client";
export const dynamic = "force-dynamic";
export default async function AccountPage(){
  const hasPassword = !!process.env.SALESGATE_PASSWORD;
  const authType = hasPassword ? "Basic Auth (SALESGATE_PASSWORD)" : "None";
  const version = "0.4.1";
  return <AccountClient envInfo={{ hasPassword, authType, version }} />;
}
