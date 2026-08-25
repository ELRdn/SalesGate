"use client";

import { Database, ExternalLink, Package, Shield } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { VERSION } from "@/lib/version";

export function AboutPanel() {
  const { t } = useI18n();
  return (
    <section className="panel about-panel">
      <h3>{t("about.title")}</h3>
      <div className="about-grid">
        <div>
          <Package size={16} />
          <span>{t("about.salesgate")}</span>
          <strong>{VERSION}</strong>
        </div>
        <div>
          <Package size={16} />
          <span>{t("about.mcpSdk")}</span>
          <strong>1.30.0</strong>
        </div>
        <div>
          <Shield size={16} />
          <span>{t("about.protocol")}</span>
          <strong>2025-06-18</strong>
        </div>
        <div>
          <Database size={16} />
          <span>{t("about.database")}</span>
          <strong>SQLite</strong>
        </div>
        <div>
          <ExternalLink size={16} />
          <span>{t("about.github")}</span>
          <strong>ELRdn/SalesGate</strong>
        </div>
        <div>
          <Shield size={16} />
          <span>{t("about.license")}</span>
          <strong>MIT</strong>
        </div>
      </div>
      <a href="https://github.com/ELRdn/SalesGate/releases" target="_blank" rel="noreferrer" className="btn ghost compact">
        <ExternalLink size={14} /> {t("about.viewLatest")}
      </a>
    </section>
  );
}
