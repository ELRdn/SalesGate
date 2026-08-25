"use client";

import { BookOpen, Copy, Settings, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";
import { useI18n } from "@/i18n/provider";

export function Onboarding({ mcpEndpoint }: { mcpEndpoint: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpEndpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <Panel className="onboarding-panel">
      <div className="onboarding-hero">
        <ShieldCheck size={28} />
        <h2>{t("onboarding.welcome")}</h2>
        <p>{t("onboarding.subtitle")}</p>
      </div>
      <div className="onboarding-steps">
        <div className="onboarding-step">
          <span>1</span>
          <div>
            <strong>{t("onboarding.step1Title")}</strong>
            <p>{t("onboarding.step1Desc")}</p>
            <Link href="/settings" className="btn ghost compact">
              <Settings size={14} /> {t("onboarding.goSettings")}
            </Link>
          </div>
        </div>
        <div className="onboarding-step">
          <span>2</span>
          <div>
            <strong>{t("onboarding.step2Title")}</strong>
            <p>{t("onboarding.step2Desc")}</p>
            <div className="masked-input" style={{ maxWidth: 420 }}>
              <input readOnly value={mcpEndpoint} />
              <button onClick={copy}>{copied ? t("common.copied") : t("common.copy")}</button>
            </div>
            <small style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span>
                <CheckCircle2 size={12} /> DSH verified
              </span>
              <span>OpenClaw example</span>
              <span>Claude Code example</span>
            </small>
          </div>
        </div>
        <div className="onboarding-step">
          <span>3</span>
          <div>
            <strong>{t("onboarding.step3Title")}</strong>
            <p>{t("onboarding.step3Desc")}</p>
            <button className="btn ghost compact" onClick={copy}>
              <Copy size={14} /> {t("onboarding.copyMcp")}
            </button>
          </div>
        </div>
        <div className="onboarding-step">
          <span>4</span>
          <div>
            <strong>{t("onboarding.step4Title")}</strong>
            <p>{t("onboarding.step4Desc")}</p>
            <Link href="/approvals" className="btn primary compact">
              {t("onboarding.openQueue")}
            </Link>
          </div>
        </div>
      </div>
      <div className="onboarding-actions">
        <Link href="/settings" className="btn ghost">
          <Settings size={15} /> {t("onboarding.goSettings")}
        </Link>
        <Link href="/approvals" className="btn primary">
          {t("onboarding.openQueue")}
        </Link>
        <a href="https://github.com/ELRdn/SalesGate#quick-start" target="_blank" rel="noreferrer" className="btn ghost">
          <BookOpen size={15} /> {t("onboarding.openGuide")}
        </a>
      </div>
    </Panel>
  );
}
