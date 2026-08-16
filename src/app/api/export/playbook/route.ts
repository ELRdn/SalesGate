// プレイブックJSONのエクスポート
// http://localhost:3000/api/export/playbook でダウンロード（BOMなしUTF-8）
import { exportPlaybook } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const json = await exportPlaybook();

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const filename = `salesgate-playbook-${date}.json`;

  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
