"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { runFollowUpsNow } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

export function DashboardFollowupButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const handle = () => {
    startTransition(async () => {
      try {
        const result = await runFollowUpsNow();
        alert(t("dashboard.followupsCreated", { count: result.followUpTasksCreated }));
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("errors.generic"));
      }
    });
  };

  return (
    <button className="followup" onClick={handle} disabled={isPending}>
      <RefreshCw size={14} />
      {isPending ? t("dashboard.generating") : t("dashboard.generateFollowups")}
    </button>
  );
}
