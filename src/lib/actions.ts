// Server Actions — 承認キュー・リード・タスク・設定の操作
"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus, TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "./prisma";
import { assertTransition, type ApprovalStatus } from "./approval-machine";
import { parseCsvLeads } from "./csv";
import { runFollowUpGeneration } from "./followup";

// ─────────────────────────────────────────────────────────────
// 承認キュー
// ─────────────────────────────────────────────────────────────

/** 承認（送信待ちへ） */
export async function approveApprovalItem(id: string) {
  const item = await prisma.approvalItem.findUnique({ where: { id } });
  if (!item) throw new Error("アイテムが見つかりません");
  assertTransition(item.status as ApprovalStatus, "APPROVED");
  await prisma.approvalItem.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  revalidatePaths();
}

/** 却下（フィードバック付き） */
export async function rejectApprovalItem(id: string, feedback: string) {
  const item = await prisma.approvalItem.findUnique({ where: { id } });
  if (!item) throw new Error("アイテムが見つかりません");
  assertTransition(item.status as ApprovalStatus, "REJECTED");
  await prisma.approvalItem.update({
    where: { id },
    data: { status: "REJECTED", rejectedAt: new Date(), feedback: feedback || null },
  });
  revalidatePaths();
}

/** 編集して承認（editedBody に保存、状態は EDITED = 承認済み扱い） */
export async function editAndApproveApprovalItem(
  id: string,
  subject: string,
  body: string,
  note?: string,
) {
  const item = await prisma.approvalItem.findUnique({ where: { id } });
  if (!item) throw new Error("アイテムが見つかりません");
  if (!subject.trim() || !body.trim()) throw new Error("件名と本文は必須です");
  assertTransition(item.status as ApprovalStatus, "EDITED");
  await prisma.approvalItem.update({
    where: { id },
    data: {
      status: "EDITED",
      subject: subject.trim(),
      editedBody: body.trim(),
      approvedAt: new Date(),
      feedback: note?.trim() || null,
    },
  });
  revalidatePaths();
}

/** 失敗アイテムの再送信を許可（FAILED → APPROVED に戻し、エージェントが再claim可能に） */
export async function retryFailedApprovalItem(id: string) {
  const item = await prisma.approvalItem.findUnique({ where: { id } });
  if (!item) throw new Error("アイテムが見つかりません");
  assertTransition(item.status as ApprovalStatus, "APPROVED");
  await prisma.approvalItem.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), error: null },
  });
  revalidatePaths();
}

// ─────────────────────────────────────────────────────────────
// リード（ミニCRM）
// ─────────────────────────────────────────────────────────────

/** リード追加（メール重複は拒否） */
export async function addLead(input: {
  company: string;
  contactName?: string;
  email: string;
  notes?: string;
}) {
  const company = input.company.trim();
  const email = input.email.trim().toLowerCase();
  if (!company || !email) throw new Error("会社名とメールアドレスは必須です");
  if (!email.includes("@")) throw new Error("メールアドレスの形式が正しくありません");

  const existing = await prisma.lead.findUnique({ where: { email } });
  if (existing) throw new Error(`同じメールアドレスのリードが既に存在します: ${email}`);

  await prisma.lead.create({
    data: {
      company,
      contactName: input.contactName?.trim() || null,
      email,
      notes: input.notes?.trim() || null,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/");
}

/** CSV一括投入（重複・不正メールはスキップして件数を返す） */
export async function importLeadsCsv(raw: string): Promise<{ added: number; skipped: number }> {
  const rows = parseCsvLeads(raw);
  let added = 0;
  let skipped = 0;
  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!email.includes("@")) {
      skipped++;
      continue;
    }
    const existing = await prisma.lead.findUnique({ where: { email } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.lead.create({
      data: {
        company: row.company.trim(),
        contactName: row.contactName?.trim() || null,
        email,
      },
    });
    added++;
  }
  revalidatePath("/leads");
  revalidatePath("/");
  return { added, skipped };
}

/** リードステータス更新（SUPPRESSED = 抑制リスト） */
export async function updateLeadStatus(id: string, status: LeadStatus) {
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/leads");
  revalidatePath("/");
}

/** リード削除 */
export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
  revalidatePath("/");
}

// ─────────────────────────────────────────────────────────────
// タスク
// ─────────────────────────────────────────────────────────────

/** タスク作成 */
export async function createTask(input: {
  type: TaskType;
  title: string;
  description?: string;
  leadId?: string;
  dueAt?: string;
}) {
  if (!input.title.trim()) throw new Error("タスク名は必須です");
  await prisma.task.create({
    data: {
      type: input.type,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      leadId: input.leadId || null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

/** タスク状態更新 */
export async function updateTaskStatus(id: string, status: TaskStatus) {
  await prisma.task.update({ where: { id }, data: { status } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

/** タスクへの回答（request_review への返答など）。回答済みは DONE に */
export async function respondToTask(id: string, comment: string) {
  if (!comment.trim()) throw new Error("回答内容は必須です");
  await prisma.task.update({
    where: { id },
    data: { humanComment: comment.trim(), status: "DONE" },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

// ─────────────────────────────────────────────────────────────
// 設定
// ─────────────────────────────────────────────────────────────

/** 設定の一括更新 */
export async function updateSettings(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    const num = Number.parseInt(value, 10);
    if (!Number.isFinite(num) || num < 0) throw new Error(`設定値が不正です: ${key}=${value}`);
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(num) },
      create: { key, value: String(num) },
    });
  }
  revalidatePath("/settings");
}

/** フォローアップ生成を今すぐ実行（手動トリガー） */
export async function runFollowUpsNow() {
  const result = await runFollowUpGeneration();
  revalidatePath("/");
  revalidatePath("/tasks");
  return result;
}

function revalidatePaths() {
  revalidatePath("/approvals");
  revalidatePath("/");
}
