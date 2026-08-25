"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { runFollowUpsNow } from "@/lib/actions";

export function DashboardFollowupButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      try {
        const result = await runFollowUpsNow();
        alert(`${result.followUpTasksCreated} 件のフォローアップタスクを生成しました`);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "生成に失敗しました");
      }
    });
  };

  return (
    <button className="followup" onClick={handle} disabled={isPending}>
      <RefreshCw size={14} />
      {isPending ? "生成中..." : "今すぐフォローアップ生成"}
    </button>
  );
}
