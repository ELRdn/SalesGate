// SalesGate MCP サーバー
// エージェントハーネス（DSH / OpenClaw / Claude Code 等）が接続するツール群を定義する
// 設計原則: 送信できるのは「承認済みアイテムのID」を指定した場合のみ（claim制・冪等）
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "./prisma";
import { assertTransition, type ApprovalStatus } from "./approval-machine";
import { sendSlackNotification } from "./notify";
import { hashEmailBody, verifyEmailBody } from "./hash";

/** ツール結果ヘルパー（JSONテキストを返す） */
function textResult(obj: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
  };
}

function fail(message: string) {
  return textResult({ ok: false, error: message });
}

export function createSalesServer(): McpServer {
  const server = new McpServer({
    name: "sales-gate",
    version: "0.1.0",
  });

  // ─────────────────────────────────────────────────────────────
  // 1. submit_draft: 下書きを承認キューに提出
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "submit_draft",
    {
      title: "下書きを承認キューに提出",
      description:
        "外部送信予定の下書き（件名・本文）を承認キューに提出します。承認されるまで外部には送信されません。提出後は人間の承認を待ってください。",
      inputSchema: {
        subject: z.string().min(1).describe("メール件名"),
        body: z.string().min(1).describe("メール本文"),
        leadId: z.string().optional().describe("対象リードのID（search_leadsで検索可能）"),
        agentName: z.string().optional().describe("提出エージェント名（監査用）"),
        evidence: z.string().optional().describe("根拠: なぜこのリードに送るか（調査メモ・出典）"),
        riskFlags: z
          .array(z.string())
          .optional()
          .describe("リスクフラグ（例: [\"抑制リスト該当\", \"過去に返信あり\"]）"),
      },
    },
    async ({ subject, body, leadId, agentName, evidence, riskFlags }) => {
      // 抑制リストチェック（コンプライアンスの安全弁）
      if (leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return fail(`リードが見つかりません: ${leadId}`);
        if (lead.status === "SUPPRESSED")
          return fail("このリードは抑制リストに該当するため提出できません");
      }
      // リード単位の排他（v0.3-2）: 同じリードに承認待ち・送信待ち・送信中の下書きがある場合は拒否（二重タッチ防止）
      if (leadId) {
        const existing = await prisma.approvalItem.findFirst({
          where: {
            leadId,
            status: { in: ["AWAITING_APPROVAL", "APPROVED", "EDITED", "CLAIMED"] },
          },
        });
        if (existing)
          return fail(
            "このリードには既に承認待ち・送信待ちの下書きがあります。処理が完了するまで新規提出はできません（二重タッチ防止）",
          );
      }
      const item = await prisma.approvalItem.create({
        data: {
          subject,
          body,
          leadId: leadId ?? null,
          submittedBy: agentName ?? null,
          evidence: evidence ?? null,
          riskFlags: riskFlags && riskFlags.length > 0 ? JSON.stringify(riskFlags) : null,
          status: "AWAITING_APPROVAL",
        },
      });
      // 承認待ちの発生を通知（Webhook未設定なら何もしない・失敗しても無視）
      void sendSlackNotification(
        "🟡 新しい承認待ちが来ました",
        `**${subject}**\n提出者: ${agentName ?? "不明"}\nリード: ${leadId ? "紐付けあり" : "未紐付け"}\n→ http://localhost:3001/approvals で確認`,
      );
      return textResult({
        ok: true,
        id: item.id,
        status: item.status,
        message: "承認キューに提出しました。人間の承認を待ってください。",
      });
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 2. list_pending_tasks: エージェント宛タスク一覧
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "list_pending_tasks",
    {
      title: "タスク一覧を取得",
      description: "自分宛のタスク一覧を取得します（デフォルトは未着手のみ）。",
      inputSchema: {
        status: z
          .enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"])
          .optional()
          .describe("絞り込みステータス（省略時はPENDING）"),
        assignee: z.string().optional().describe("担当エージェント名で絞り込み（エージェント別ビュー）"),
        limit: z.number().int().min(1).max(100).optional().describe("取得上限（デフォルト50）"),
      },
    },
    async ({ status, assignee, limit }) => {
      const tasks = await prisma.task.findMany({
        where: {
          status: status ?? "PENDING",
          ...(assignee ? { assignedTo: assignee } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: limit ?? 50,
        include: { lead: true },
      });
      return textResult(
        tasks.map((t) => ({
          id: t.id,
          type: t.type,
          title: t.title,
          description: t.description,
          status: t.status,
          humanComment: t.humanComment,
          assignedTo: t.assignedTo,
          dueAt: t.dueAt,
          lead: t.lead
            ? { id: t.lead.id, company: t.lead.company, contactName: t.lead.contactName, email: t.lead.email }
            : null,
        })),
      );
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 3. get_approved_send_items: 承認済み送信アイテムを claim
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "get_approved_send_items",
    {
      title: "承認済み送信アイテムを取得（claim）",
      description:
        "人間に承認された送信アイテムを取得します。取得と同時にclaimされ、他のエージェントは取得できません（二重送信防止）。送信後は必ず report_send_result で結果を報告してください。",
      inputSchema: {
        agentName: z.string().min(1).describe("このエージェントの名前（claim記録用）"),
        limit: z.number().int().min(1).max(50).optional().describe("取得上限（デフォルト10）"),
      },
    },
    async ({ agentName, limit }) => {
      const claimed = await prisma.$transaction(async (tx) => {
        const candidates = await tx.approvalItem.findMany({
          where: { status: { in: ["APPROVED", "EDITED"] } },
          orderBy: { approvedAt: "asc" },
          take: limit ?? 10,
          include: { lead: true },
        });
        const result = [];
        for (const item of candidates) {
          // updateMany の where で状態を再確認 → 二重claimの冪等ガード
          const res = await tx.approvalItem.updateMany({
            where: { id: item.id, status: { in: ["APPROVED", "EDITED"] } },
            data: { status: "CLAIMED", claimedBy: agentName, claimedAt: new Date() },
          });
          if (res.count > 0) result.push(item);
        }
        return result;
      });
      return textResult(
        claimed.map((i) => ({
          id: i.id,
          subject: i.subject,
          body: i.editedBody ?? i.body, // 人間が編集した場合は編集後本文
          lead: i.lead
            ? { id: i.lead.id, company: i.lead.company, contactName: i.lead.contactName, email: i.lead.email }
            : null,
          approvedAt: i.approvedAt,
        })),
      );
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 4. report_send_result: 送信結果の報告
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "report_send_result",
    {
      title: "送信結果を報告",
      description:
        "get_approved_send_items で claim したアイテムの送信結果（成功/失敗）を報告します。失敗時は再試行可能になります。",
      inputSchema: {
        approvalItemId: z.string().describe("claimした承認アイテムのID"),
        success: z.boolean().describe("送信成功かどうか"),
        messageId: z.string().optional().describe("メールのMessage-ID（成功時）"),
        error: z.string().optional().describe("失敗理由（失敗時）"),
        sentBody: z
          .string()
          .optional()
          .describe("実際に送信した本文（成功時。承認原文とのハッシュ照合に使われます）"),
      },
    },
    async ({ approvalItemId, success, messageId, error, sentBody }) => {
      const item = await prisma.approvalItem.findUnique({ where: { id: approvalItemId } });
      if (!item) return fail(`アイテムが見つかりません: ${approvalItemId}`);
      // 状態遷移の検証（CLAIMED からのみ SENT/FAILED へ）
      try {
        assertTransition(item.status as ApprovalStatus, success ? "SENT" : "FAILED");
      } catch (e) {
        return fail(e instanceof Error ? e.message : "不正な状態遷移");
      }
      const now = new Date();
      // 本文ハッシュ照合（v0.3-1）: 送信後検証。承認時にロックした原文と、実際に送信した本文を比較する
      // 注意: 送信後の「検知」であり「防止」ではない。不一致は監査ログとして記録される
      let hashMatched: boolean | null = null;
      if (success && sentBody !== undefined && sentBody.trim() !== "") {
        hashMatched = verifyEmailBody(item.lockedHash, item.subject, sentBody);
      }
      const updated = await prisma.approvalItem.update({
        where: { id: approvalItemId },
        data: {
          status: success ? "SENT" : "FAILED",
          sentAt: success ? now : null,
          messageId: messageId ?? null,
          error: success ? null : (error ?? "不明なエラー"),
          ...(hashMatched === false ? { hashMismatchAt: now } : {}),
        },
      });
      // 監査ログ（送信履歴）
      await prisma.messageLog.create({
        data: {
          approvalItemId,
          leadId: item.leadId,
          subject: item.subject,
          body: item.editedBody ?? item.body,
          status: success ? "SENT" : "FAILED",
          messageId: messageId ?? null,
          error: success ? null : (error ?? null),
          sentBy: item.claimedBy,
        },
      });
      // リードのタッチカウント更新（成功時のみ）
      if (success && item.leadId) {
        await prisma.lead.update({
          where: { id: item.leadId },
          data: { touchCount: { increment: 1 }, lastTouchAt: now, nextFollowUpAt: null },
        });
      }
      return textResult({
        ok: true,
        status: updated.status,
        ...(hashMatched !== null
          ? {
              hashMatched,
              message: hashMatched
                ? "送信本文は承認原文と一致しています"
                : "警告: 送信本文が承認原文と一致しません（監査ログに記録されました）",
            }
          : {}),
      });
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 5. create_task: タスク作成（エージェントからも可能）
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "create_task",
    {
      title: "タスクを作成",
      description: "タスクを作成します。エージェントが自分や他のエージェントに仕事を依頼するのに使います。",
      inputSchema: {
        type: z
          .enum(["FOLLOW_UP", "RESEARCH", "REVIEW_REQUEST", "MEETING_PREP", "QUOTE", "CONTRACT", "CUSTOM"])
          .default("CUSTOM")
          .describe("タスク種別"),
        title: z.string().min(1).describe("タスク名"),
        description: z.string().optional().describe("詳細・指示"),
        leadId: z.string().optional().describe("関連リードID"),
        assignee: z.string().optional().describe("担当エージェント名（エージェント別ビュー用）"),
        dueAt: z.string().optional().describe("期限（ISO8601）"),
      },
    },
    async ({ type, title, description, leadId, assignee, dueAt }) => {
      const task = await prisma.task.create({
        data: {
          type,
          title,
          description: description ?? null,
          leadId: leadId ?? null,
          assignedTo: assignee ?? null,
          dueAt: dueAt ? new Date(dueAt) : null,
        },
      });
      return textResult({ ok: true, id: task.id, status: task.status });
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 6. update_task: タスク更新
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "update_task",
    {
      title: "タスクを更新",
      description: "タスクの状態・内容を更新します（着手・完了報告など）。",
      inputSchema: {
        taskId: z.string().describe("タスクID"),
        status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        assignee: z.string().optional().describe("担当エージェント名の変更"),
      },
    },
    async ({ taskId, status, title, description, assignee }) => {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: status ?? undefined,
          title: title ?? undefined,
          description: description ?? undefined,
          assignedTo: assignee ?? undefined,
        },
      });
      return textResult({ ok: true, id: task.id, status: task.status });
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 7. search_leads: リード検索
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "search_leads",
    {
      title: "リードを検索",
      description: "リードを会社名・メール・担当者名で検索します。",
      inputSchema: {
        query: z.string().optional().describe("検索語（会社名/メール/担当者名の部分一致）"),
        status: z
          .enum(["ACTIVE", "RESPONDED", "SLEEPING", "SUPPRESSED"])
          .optional()
          .describe("ステータス絞り込み"),
        limit: z.number().int().min(1).max(100).optional().describe("取得上限（デフォルト50）"),
      },
    },
    async ({ query, status, limit }) => {
      const leads = await prisma.lead.findMany({
        where: {
          AND: [
            status ? { status } : {},
            query
              ? {
                  OR: [
                    { company: { contains: query } },
                    { email: { contains: query } },
                    { contactName: { contains: query } },
                  ],
                }
              : {},
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit ?? 50,
      });
      return textResult(
        leads.map((l) => ({
          id: l.id,
          company: l.company,
          contactName: l.contactName,
          email: l.email,
          status: l.status,
          touchCount: l.touchCount,
          lastTouchAt: l.lastTouchAt,
        })),
      );
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 8. update_lead_status: リードステータス更新
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "update_lead_status",
    {
      title: "リードのステータスを更新",
      description:
        "リードのステータスを更新します。SUPPRESSED にすると抑制リスト扱いとなり、以降の送信提案がブロックされます。",
      inputSchema: {
        leadId: z.string().describe("リードID"),
        status: z.enum(["ACTIVE", "RESPONDED", "SLEEPING", "SUPPRESSED"]).describe("新しいステータス"),
      },
    },
    async ({ leadId, status }) => {
      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: { status },
      });
      return textResult({ ok: true, id: lead.id, status: lead.status });
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 9. request_review: 送信前の事前相談
  // ─────────────────────────────────────────────────────────────
  server.registerTool(
    "request_review",
    {
      title: "事前相談を依頼",
      description:
        "「この見積でいい？」など、送信前に人間の意見を聞きたいときに使います。REVIEW_REQUEST タスクとして登録され、人間の回答は humanComment に記録されます。",
      inputSchema: {
        subject: z.string().min(1).describe("相談内容のタイトル"),
        details: z.string().optional().describe("相談の詳細"),
        leadId: z.string().optional().describe("関連リードID"),
      },
    },
    async ({ subject, details, leadId }) => {
      const task = await prisma.task.create({
        data: {
          type: "REVIEW_REQUEST",
          title: subject,
          description: details ?? null,
          leadId: leadId ?? null,
        },
      });
      return textResult({
        ok: true,
        id: task.id,
        message: "事前相談を登録しました。人間の回答を list_pending_tasks で確認してください。",
      });
    },
  );

  return server;
}
