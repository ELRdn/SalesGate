// SalesGate MCP E2Eテスト
// 承認ループ全体の検証: submit_draft → 承認 → claim → report_send_result → 抑制チェック
// 使い方: node tests/e2e-mcp.mjs [BASE_URL]
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import { createHash } from "node:crypto";

// src/lib/hash.ts と同じ正規化・ハッシュ計算（テストの独立性のため再実装）
function hashEmailBody(subject, body) {
  const s = subject.replace(/\r\n/g, "\n").trim();
  const b = body.replace(/\r\n/g, "\n").trim();
  return createHash("sha256").update(`${s}\n\n${b}`, "utf8").digest("hex");
}

const BASE = process.argv[2] ?? "http://localhost:3001";
const MCP_URL = `${BASE}/mcp`;

const adapter = new PrismaBetterSQLite3({
  url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
});
const prisma = new PrismaClient({ adapter });

let sessionId = null;
async function rpc(method, params, withId = true) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const body = { jsonrpc: "2.0", method, params };
  if (withId) body.id = 1 + Math.floor(Math.random() * 100000);
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}:`, text.slice(0, 300));
    process.exit(1);
  }
  if (!withId) return null; // 通知はレスポンス不要
  // SSE形式（"data:" 行）とJSON形式の両方に対応
  if (text.includes("data:")) {
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t.startsWith("data:")) return JSON.parse(t.slice(5));
    }
  }
  return JSON.parse(text);
}

/** MCPツール呼び出し（tools/call 経由） */
async function callTool(name, args) {
  return rpc("tools/call", { name, arguments: args });
}

let pass = 0;
let fail = 0;
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

function toolText(res) {
  const text = res?.result?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

try {
  console.log("0. テストデータのクリーンアップ");
  await prisma.lead.deleteMany({ where: { email: { in: ["e2e@test.local", "e2e2@test.local"] } } });

  console.log("1. initialize");
  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "e2e-test", version: "1.0.0" },
  });
  check("サーバー情報が返る", !!init.result?.serverInfo, JSON.stringify(init.result?.serverInfo));

  await rpc("notifications/initialized", {}, false);

  console.log("2. tools/list");
  const tools = await rpc("tools/list", {});
  const names = tools.result?.tools?.map((t) => t.name) ?? [];
  check("9ツールが登録されている", names.length === 9, `実際: ${names.length}`);
  for (const expected of [
    "submit_draft",
    "list_pending_tasks",
    "get_approved_send_items",
    "report_send_result",
    "create_task",
    "update_task",
    "search_leads",
    "update_lead_status",
    "request_review",
  ]) {
    check(`ツール ${expected}`, names.includes(expected));
  }

  console.log("3. テスト用リード作成");
  const lead = await prisma.lead.create({
    data: { company: "E2Eテスト社", contactName: "テスト太郎", email: "e2e@test.local" },
  });

  console.log("4. submit_draft（下書き提出）");
  const draft = await callTool("submit_draft", {
    subject: "E2Eテストメール",
    body: "これはE2Eテストの本文です。",
    leadId: lead.id,
    agentName: "e2e-agent",
    evidence: "テスト用の根拠",
    riskFlags: [],
  });
  const draftObj = toolText(draft);
  check("下書き提出が成功", draftObj.ok === true, JSON.stringify(draftObj));
  const itemId = draftObj.id;

  const item1 = await prisma.approvalItem.findUnique({ where: { id: itemId } });
  check("状態=承認待ち", item1?.status === "AWAITING_APPROVAL", item1?.status);

  console.log("5. 未承認のままclaimできない");
  const emptyClaim = await callTool("get_approved_send_items", { agentName: "e2e-agent" });
  const emptyArr = toolText(emptyClaim);
  check("取得結果が空", Array.isArray(emptyArr) && emptyArr.length === 0, JSON.stringify(emptyArr));

  console.log("6. 人間が承認（APPROVEDへ）");
  // 注: 実際の承認は approveApprovalItem アクションが lockedHash も保存する。
  // E2EではDB直接更新のため、ハッシュ照合の基準となる lockedHash を明示的に設定する
  await prisma.approvalItem.update({
    where: { id: itemId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      lockedHash: hashEmailBody("E2Eテストメール", "これはE2Eテストの本文です。"),
    },
  });

  console.log("7. get_approved_send_items（claim）");
  const claimed = await callTool("get_approved_send_items", { agentName: "e2e-agent" });
  const claimedArr = toolText(claimed);
  check(
    "claimに成功（1件取得）",
    Array.isArray(claimedArr) && claimedArr.length === 1 && claimedArr[0].id === itemId,
    JSON.stringify(claimedArr),
  );

  console.log("8. 二重claimはできない（2回目は空）");
  const again = await callTool("get_approved_send_items", { agentName: "e2e-agent" });
  const againArr = toolText(again);
  check("2回目の取得は空", Array.isArray(againArr) && againArr.length === 0, JSON.stringify(againArr));

  console.log("9. report_send_result（送信成功・本文ハッシュ照合）");
  const report = await callTool("report_send_result", {
    approvalItemId: itemId,
    success: true,
    messageId: "<e2e-msg-id@test.local>",
    sentBody: "これはE2Eテストの本文です。",
  });
  const reportObj = toolText(report);
  check("結果報告が成功", reportObj.ok === true, JSON.stringify(reportObj));
  check(
    "本文ハッシュ一致（hashMatched=true）",
    reportObj.hashMatched === true,
    JSON.stringify(reportObj),
  );

  const item2 = await prisma.approvalItem.findUnique({ where: { id: itemId } });
  check("状態=送信済み", item2?.status === "SENT", item2?.status);

  const logCount = await prisma.messageLog.count({ where: { approvalItemId: itemId } });
  check("監査ログが記録された", logCount === 1, `logs=${logCount}`);

  const leadAfter = await prisma.lead.findUnique({ where: { id: lead.id } });
  check("タッチカウントが+1", leadAfter?.touchCount === 1, `touchCount=${leadAfter?.touchCount}`);

  console.log("9.5 本文不一致の検知（ハッシュ照合）");
  const draft2 = await callTool("submit_draft", {
    subject: "ハッシュ照合テスト",
    body: "承認された本文",
    agentName: "e2e-agent",
  });
  const draft2Obj = toolText(draft2);
  check("下書き2の提出が成功", draft2Obj.ok === true, JSON.stringify(draft2Obj));
  const itemId2 = draft2Obj.id;
  // 人間の承認（lockedHash を保存するのは approve アクション。テストでは直接設定）
  await prisma.approvalItem.update({
    where: { id: itemId2 },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      lockedHash: hashEmailBody("ハッシュ照合テスト", "承認された本文"),
    },
  });
  const claimed2 = await callTool("get_approved_send_items", { agentName: "e2e-agent" });
  const claimed2Arr = toolText(claimed2);
  check(
    "claimに成功（2件目）",
    Array.isArray(claimed2Arr) && claimed2Arr.length === 1 && claimed2Arr[0].id === itemId2,
    JSON.stringify(claimed2Arr),
  );
  // 承認された本文と「異なる」本文を送信したと報告 → 不一致を検知
  const report2 = await callTool("report_send_result", {
    approvalItemId: itemId2,
    success: true,
    messageId: "<e2e-msg-id2@test.local>",
    sentBody: "改ざんされた本文（承認原文と不一致）",
  });
  const report2Obj = toolText(report2);
  check("報告は成功する（SENT）", report2Obj.ok === true && report2Obj.status === "SENT", JSON.stringify(report2Obj));
  check("hashMatched=false で不一致を検知", report2Obj.hashMatched === false, JSON.stringify(report2Obj));
  const item2b = await prisma.approvalItem.findUnique({ where: { id: itemId2 } });
  check("hashMismatchAt が記録される", item2b?.hashMismatchAt != null, JSON.stringify(item2b?.hashMismatchAt));

  console.log("10. 抑制リストチェック（SUPPRESSEDリードへの提出ブロック）");
  await prisma.lead.update({ where: { id: lead.id }, data: { status: "SUPPRESSED" } });
  const blocked = await callTool("submit_draft", {
    subject: "抑制テスト",
    body: "本文",
    leadId: lead.id,
    agentName: "e2e-agent",
  });
  const blockedObj = toolText(blocked);
  check("ブロックされる", blockedObj.ok === false, JSON.stringify(blockedObj));

  console.log("10.5 リード単位の排他（承認待ちがある間は再提出できない）");
  const lead2 = await prisma.lead.create({
    data: { company: "E2E排他テスト社", contactName: "排他太郎", email: "e2e2@test.local" },
  });
  const draft3 = await callTool("submit_draft", {
    subject: "排他テスト1",
    body: "本文1",
    leadId: lead2.id,
    agentName: "e2e-agent",
  });
  const draft3Obj = toolText(draft3);
  check("1件目は提出できる", draft3Obj.ok === true, JSON.stringify(draft3Obj));
  const draft4 = await callTool("submit_draft", {
    subject: "排他テスト2",
    body: "本文2",
    leadId: lead2.id,
    agentName: "e2e-agent",
  });
  const draft4Obj = toolText(draft4);
  check(
    "承認待ちがある間は2件目を拒否",
    draft4Obj.ok === false && /二重タッチ防止/.test(draft4Obj.error ?? ""),
    JSON.stringify(draft4Obj),
  );

  console.log("10.6 リード単位の排他（送信完了後は再提出できる）");
  await prisma.approvalItem.updateMany({
    where: { leadId: lead2.id },
    data: { status: "APPROVED", approvedAt: new Date(), lockedHash: hashEmailBody("排他テスト1", "本文1") },
  });
  const claimed3 = await callTool("get_approved_send_items", { agentName: "e2e-agent" });
  const claimed3Arr = toolText(claimed3);
  check(
    "claimに成功（排他テスト）",
    Array.isArray(claimed3Arr) && claimed3Arr.length === 1,
    JSON.stringify(claimed3Arr),
  );
  await callTool("report_send_result", {
    approvalItemId: claimed3Arr[0].id,
    success: true,
    sentBody: "本文1",
  });
  const draft5 = await callTool("submit_draft", {
    subject: "排他テスト3",
    body: "本文3",
    leadId: lead2.id,
    agentName: "e2e-agent",
  });
  const draft5Obj = toolText(draft5);
  check("送信完了後は再提出できる", draft5Obj.ok === true, JSON.stringify(draft5Obj));

  console.log("10.7 エージェント別タスクビュー（assignee）");
  await callTool("create_task", { type: "RESEARCH", title: "エージェントA宛タスク", assignee: "agent-a" });
  await callTool("create_task", { type: "RESEARCH", title: "エージェントB宛タスク", assignee: "agent-b" });
  const tasksA = toolText(await callTool("list_pending_tasks", { assignee: "agent-a" }));
  check(
    "agent-a のタスクのみ見える",
    Array.isArray(tasksA) && tasksA.length === 1 && tasksA[0].title === "エージェントA宛タスク" && tasksA[0].assignedTo === "agent-a",
    JSON.stringify(tasksA),
  );
  const tasksB = toolText(await callTool("list_pending_tasks", { assignee: "agent-b" }));
  check(
    "agent-b のタスクのみ見える",
    Array.isArray(tasksB) && tasksB.length === 1 && tasksB[0].title === "エージェントB宛タスク",
    JSON.stringify(tasksB),
  );

  console.log("11. request_review（事前相談）");
  const review = await callTool("request_review", {
    subject: "この見積でいい？",
    details: "見積の詳細",
    leadId: lead.id,
  });
  const reviewObj = toolText(review);
  check("事前相談タスクが作成される", reviewObj.ok === true, JSON.stringify(reviewObj));

  console.log("12. クリーンアップ");
  await prisma.messageLog.deleteMany({ where: { approvalItemId: { in: [itemId, itemId2] } } });
  await prisma.approvalItem.deleteMany({ where: { OR: [{ leadId: lead.id }, { leadId: lead2.id }, { id: itemId2 }] } });
  await prisma.task.deleteMany({
    where: { OR: [{ leadId: lead.id }, { leadId: lead2.id }, { title: { in: ["エージェントA宛タスク", "エージェントB宛タスク"] } }] },
  });
  await prisma.lead.deleteMany({ where: { id: { in: [lead.id, lead2.id] } } });
  console.log("  🧹 テストデータ削除完了");

  console.log(`\n=== E2E結果: ${pass} passed / ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
} catch (e) {
  console.error("E2Eエラー:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
