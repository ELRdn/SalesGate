"use client";

import { Download, Filter, Mail, Plus, Search, Upload, UserRoundPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader, Panel } from "@/components/ui";
import { addLead, importLeadsCsv } from "@/lib/actions";
import { timeAgo } from "@/lib/serialize";
import { useI18n } from "@/i18n/provider";

type LeadRow = {
  id: string;
  company: string;
  person: string;
  email: string;
  status: "アクティブ" | "返信あり" | "休眠" | "抑制中";
  dbStatus: string;
  touches: number;
  lastTouch: string;
  lastTouchLabel: string;
  nextAction: string;
  notes: string;
  createdAt: string;
};

export function LeadsClient({ initialLeads }: { initialLeads: LeadRow[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      initialLeads.filter(
        (lead) =>
          (status === "ALL" || lead.dbStatus === status) &&
          `${lead.company} ${lead.person} ${lead.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [initialLeads, query, status],
  );

  const handleAdd = (company: string, person: string, email: string) => {
    startTransition(async () => {
      try {
        await addLead({ company, contactName: person, email });
        setAdding(false);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : t("leads.addError"));
      }
    });
  };

  const handleCsvImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      startTransition(async () => {
        try {
          const res = await importLeadsCsv(text);
          alert(t("leads.importSuccess", { added: res.added, skipped: res.skipped }));
          router.refresh();
        } catch (e) {
          alert(e instanceof Error ? e.message : t("leads.addError"));
        }
      });
    };
    input.click();
  };

  const handleExport = () => {
    window.location.href = "/api/export/leads";
  };

  return (
    <div className="workspace-page">
      <PageHeader
        title={t("leads.title")}
        description={t("leads.description")}
        action={
          <div className="header-actions">
            <button className="btn ghost" onClick={handleExport}>
              <Download size={15} />
              {t("leads.csv")}
            </button>
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Plus size={15} />
              {t("leads.addLead")}
            </button>
          </div>
        }
      />
      <div className="metric-strip">
        <Metric label={t("leads.total")} value={String(initialLeads.length)} sub={t("leads.registered")} tone="blue" />
        <Metric label={t("leads.active")} value={String(initialLeads.filter((x) => x.dbStatus === "ACTIVE").length)} sub={t("leads.inProgress")} tone="green" />
        <Metric label={t("leads.responded")} value={String(initialLeads.filter((x) => x.dbStatus === "RESPONDED").length)} sub={t("leads.needsReply")} tone="violet" />
        <Metric label={t("leads.suppressed")} value={String(initialLeads.filter((x) => x.dbStatus === "SUPPRESSED").length)} sub={t("leads.blocked")} tone="red" />
      </div>
      <Panel className="data-panel">
        <div className="data-toolbar">
          <label className="search-box wide">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("leads.searchPlaceholder")} />
          </label>
          <div className="toolbar-right">
            <label className="select-wrap">
              <Filter size={14} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">{t("common.all")}</option>
                <option value="ACTIVE">{t("status.lead.ACTIVE")}</option>
                <option value="RESPONDED">{t("status.lead.RESPONDED")}</option>
                <option value="SLEEPING">{t("status.lead.SLEEPING")}</option>
                <option value="SUPPRESSED">{t("status.lead.SUPPRESSED")}</option>
              </select>
            </label>
            <button className="btn ghost compact" onClick={handleCsvImport} disabled={isPending}>
              <Upload size={14} />
              {t("leads.import")}
            </button>
          </div>
        </div>
        <div className="data-table lead-table">
          <div className="table-head">
            <span>{t("leads.companyContact")}</span>
            <span>{t("leads.status")}</span>
            <span>{t("leads.email")}</span>
            <span>{t("leads.touches")}</span>
            <span>{t("leads.lastTouch")}</span>
            <span>{t("leads.nextAction")}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120, padding: 20 }}>
              <strong>{t("leads.noLeads")}</strong>
              <span>{t("leads.noLeadsDesc")}</span>
            </div>
          ) : (
            filtered.map((lead) => (
              <button key={lead.id} className="table-row" onClick={() => setSelected(lead)}>
                <span className="lead-main">
                  <strong>{lead.company}</strong>
                  <small>
                    {lead.person} · {lead.email}
                  </small>
                </span>
                <span>
                  <LeadStatus dbStatus={lead.dbStatus} />
                </span>
                <span className="truncate-cell" style={{ fontSize: 10 }}>{lead.email}</span>
                <span>{lead.touches}</span>
                <span>{lead.lastTouch ? timeAgo(lead.lastTouch) : "—"}</span>
                <span className="next-action">{lead.nextAction}</span>
              </button>
            ))
          )}
        </div>
        <div className="table-footer">
          <span>
            {t("common.showing", { filtered: filtered.length, total: initialLeads.length })}
          </span>
          <div>
            <button disabled>Prev</button>
            <b>1</b>
            <button disabled>Next</button>
          </div>
        </div>
      </Panel>
      {adding ? <AddLeadModal onClose={() => setAdding(false)} onAdd={handleAdd} pending={isPending} /> : null}
      {selected ? (
        <Modal title={t("leads.detailTitle")} onClose={() => setSelected(null)}>
          <div className="modal-body lead-detail">
            <div className="detail-identity">
              <div className="identity-icon">
                <UserRoundPlus size={22} />
              </div>
              <div>
                <h3>{selected.company}</h3>
                <p>{selected.person || t("leads.contact")}</p>
                <a href={`mailto:${selected.email}`}>
                  <Mail size={13} />
                  {selected.email}
                </a>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <span>{t("leads.status")}</span>
                <LeadStatus dbStatus={selected.dbStatus} />
              </div>
              <div>
                <span>{t("leads.touchCount")}</span>
                <strong>{selected.touches} 回</strong>
              </div>
              <div>
                <span>{t("leads.lastTouch")}</span>
                <strong>{selected.lastTouch ? timeAgo(selected.lastTouch) : "—"}</strong>
              </div>
              <div>
                <span>{t("leads.registeredOn")}</span>
                <strong>{new Date(selected.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>
            {selected.notes ? (
              <div className="timeline-mini">
                <h4>{t("leads.notes")}</h4>
                <p>{selected.notes}</p>
              </div>
            ) : null}
            <div className="timeline-mini">
              <h4>{t("leads.recentHistory")}</h4>
              <p>
                <i />
                {selected.lastTouch ? `${timeAgo(selected.lastTouch)} · ${selected.nextAction}` : "—"}
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setSelected(null)}>
              {t("common.close")}
            </button>
            <button className="btn primary" onClick={() => alert(t("leads.createTask"))}>
              {t("leads.createTask")}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="mini-metric">
      <i className={tone} />
      <span>
        {label}
        <small>{sub}</small>
      </span>
      <strong>{value}</strong>
    </div>
  );
}
function LeadStatus({ dbStatus }: { dbStatus: string }) {
  const { t } = useI18n();
  const key = dbStatus === "ACTIVE" ? "approved" : dbStatus === "RESPONDED" ? "claimed" : dbStatus === "SUPPRESSED" ? "rejected" : "archived";
  const label = t(`status.lead.${dbStatus}`);
  return <span className={`status-pill ${key}`}>{label}</span>;
}
function AddLeadModal({
  onClose,
  onAdd,
  pending,
}: {
  onClose: () => void;
  onAdd: (company: string, person: string, email: string) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Modal title={t("leads.addModalTitle")} onClose={onClose}>
      <div className="modal-body form-grid">
        <label>
          {t("leads.company")}
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("leads.companyPlaceholder")} />
        </label>
        <label>
          {t("leads.contact")}
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder={t("leads.contactPlaceholder")} />
        </label>
        <label className="full">
          {t("leads.email")}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("leads.emailPlaceholder")} type="email" />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </button>
        <button className="btn primary" disabled={!company || !email || pending} onClick={() => onAdd(company, person, email)}>
          {pending ? t("leads.adding") : t("leads.add")}
        </button>
      </div>
    </Modal>
  );
}
