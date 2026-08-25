"use client";

import { BookOpen, Check, Copy, Settings, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/provider";

export type OnboardingState = {
  secure: boolean;
  connected: boolean;
  submitted: boolean;
  reviewed: boolean;
};

export function Onboarding({
  mcpEndpoint,
  state,
}: {
  mcpEndpoint: string;
  state: OnboardingState;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpEndpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // 進捗から現在のステップを決定（最初に未完了のステップ）
  const steps = [
    {
      key: "secure" as const,
      shortKey: "onboarding.secureShort",
      titleKey: "onboarding.step1Title",
      descKey: "onboarding.secureDetail",
      done: state.secure,
    },
    {
      key: "connect" as const,
      shortKey: "onboarding.connectShort",
      titleKey: "onboarding.step2Title",
      descKey: "onboarding.connectDetail",
      done: state.connected,
    },
    {
      key: "submit" as const,
      shortKey: "onboarding.submitShort",
      titleKey: "onboarding.step3Title",
      descKey: "onboarding.submitDetail",
      done: state.submitted,
    },
    {
      key: "review" as const,
      shortKey: "onboarding.reviewShort",
      titleKey: "onboarding.step4Title",
      descKey: "onboarding.reviewDetail",
      done: state.reviewed,
    },
  ];

  let currentIndex = steps.findIndex((s) => !s.done);
  if (currentIndex === -1) currentIndex = steps.length - 1;
  const current = steps[currentIndex];
  const completedCount = steps.filter((s) => s.done).length;

  return (
    <section className="panel sg-onboard" role="region" aria-label={t("onboarding.welcome")}>
      {/* Header */}
      <div className="sg-onboard-header">
        <div className="sg-onboard-heading">
          <div className="sg-onboard-title-row">
            <span className="sg-onboard-shield" aria-hidden="true">
              <ShieldCheck size={14} />
            </span>
            <h2 className="sg-onboard-title">{t("onboarding.welcome")}</h2>
            <span className="sg-onboard-badge" aria-label={`${t("onboarding.setupProgress")} ${currentIndex + 1} / 4`}>
              {t("onboarding.setupProgress")} {currentIndex + 1}/4
            </span>
          </div>
          <p className="sg-onboard-subtitle">{t("onboarding.subtitle")}</p>
        </div>
      </div>

      {/* Progress strip */}
      <div className="sg-onboard-progress" role="list" aria-label={t("onboarding.setupProgress")}>
        {steps.map((s, idx) => {
          const isCompleted = s.done;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;
          return (
            <div
              key={s.key}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className={`sg-step ${isCompleted ? "is-completed" : ""} ${isCurrent ? "is-current" : ""} ${isUpcoming ? "is-upcoming" : ""}`}
            >
              <span className="sg-step-dot" aria-hidden="true">
                {isCompleted ? <Check size={11} strokeWidth={2.5} /> : <span className="sg-step-num">{idx + 1}</span>}
              </span>
              <span className="sg-step-label">{t(s.shortKey)}</span>
              {idx < steps.length - 1 && <span className="sg-step-connector" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Current step detail */}
      <div className="sg-onboard-body">
        <div className="sg-onboard-main">
          <div className="sg-onboard-current">
            <span className="sg-eyebrow">
              {t("onboarding.currentStep")} · {t(current.titleKey)}
            </span>
            <h3 className="sg-current-title">{t(current.titleKey)}</h3>
            <p className="sg-current-desc">{t(current.descKey)}</p>

            {/* Connect step: MCP endpoint + integrations */}
            {current.key === "connect" && (
              <div className="sg-mcp-block">
                <div className="sg-mcp-row" role="group" aria-label={t("onboarding.mcpEndpoint")}>
                  <div className="sg-mcp-field">
                    <label className="sg-mcp-label" htmlFor="sg-mcp-input">
                      {t("onboarding.mcpEndpoint")}
                    </label>
                    <div className="sg-mcp-input-wrap">
                      <input id="sg-mcp-input" readOnly value={mcpEndpoint} aria-label={t("onboarding.mcpEndpoint")} />
                      <button
                        type="button"
                        onClick={copy}
                        className="btn primary compact sg-copy-btn"
                        aria-label={copied ? t("common.copied") : t("onboarding.copyMcp")}
                      >
                        <Copy size={12} aria-hidden="true" />
                        {copied ? t("common.copied") : t("common.copy")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sg-integrations" aria-label={t("onboarding.suggestedIntegrations")}>
                  <span className="sg-integrations-label">{t("onboarding.suggestedIntegrations")}</span>
                  <div className="sg-integration-grid">
                    <div className="sg-integration">
                      <span className="sg-integration-dot" style={{ background: "#42c976" }} aria-hidden="true" />
                      <span className="sg-integration-name">DSH</span>
                      <span className="sg-badge verified">{t("onboarding.verified")}</span>
                    </div>
                    <div className="sg-integration">
                      <span className="sg-integration-dot" style={{ background: "#8b5cf6" }} aria-hidden="true" />
                      <span className="sg-integration-name">OpenClaw</span>
                      <span className="sg-badge example">{t("onboarding.example")}</span>
                    </div>
                    <div className="sg-integration">
                      <span className="sg-integration-dot" style={{ background: "#f59e0b" }} aria-hidden="true" />
                      <span className="sg-integration-name">Claude Code</span>
                      <span className="sg-badge example">{t("onboarding.example")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Secure step: hint, no endpoint */}
            {current.key === "secure" && (
              <div className="sg-secure-hint">
                <code className="sg-code-inline">SALESGATE_PASSWORD</code>
                <span className="sg-hint-text">→ Settings → Security</span>
              </div>
            )}

            {/* Submit / Review hints */}
            {(current.key === "submit" || current.key === "review") && completedCount === 0 && (
              <div className="sg-mcp-row compact">
                <div className="sg-mcp-field">
                  <div className="sg-mcp-input-wrap">
                    <input readOnly value={mcpEndpoint} aria-label={t("onboarding.mcpEndpoint")} />
                    <button
                      type="button"
                      onClick={copy}
                      className="btn ghost compact"
                      aria-label={copied ? t("common.copied") : t("onboarding.copyMcp")}
                    >
                      <Copy size={12} aria-hidden="true" />
                      {copied ? t("common.copied") : t("common.copy")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions — hierarchy per step */}
          <div className="sg-onboard-actions">
            {current.key === "secure" && (
              <>
                <Link href="/settings" className="btn primary compact">
                  <Settings size={13} aria-hidden="true" />
                  {t("onboarding.openSecuritySettings")}
                </Link>
                <a
                  href="https://github.com/ELRdn/SalesGate#quick-start"
                  target="_blank"
                  rel="noreferrer"
                  className="btn ghost compact"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  {t("onboarding.openGuide")}
                </a>
              </>
            )}
            {current.key === "connect" && (
              <>
                <button type="button" onClick={copy} className="btn primary compact">
                  <Copy size={13} aria-hidden="true" />
                  {copied ? t("common.copied") : t("onboarding.copyMcp")}
                </button>
                <a
                  href="https://github.com/ELRdn/SalesGate#quick-start"
                  target="_blank"
                  rel="noreferrer"
                  className="btn ghost compact"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  {t("onboarding.openGuide")}
                </a>
              </>
            )}
            {current.key === "submit" && (
              <>
                <button type="button" onClick={copy} className="btn primary compact">
                  <Copy size={13} aria-hidden="true" />
                  {copied ? t("common.copied") : t("onboarding.copyMcp")}
                </button>
                <Link href="/approvals" className="btn ghost compact">
                  {t("onboarding.openQueue")}
                </Link>
              </>
            )}
            {current.key === "review" && (
              <>
                <Link href="/approvals" className="btn primary compact">
                  {t("onboarding.openQueue")}
                </Link>
                <a
                  href="https://github.com/ELRdn/SalesGate#quick-start"
                  target="_blank"
                  rel="noreferrer"
                  className="btn ghost compact"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  {t("onboarding.openGuide")}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
