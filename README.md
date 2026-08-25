[English](README.md) | [日本語](README.ja.md)

# SalesGate

[![Release](https://img.shields.io/github/v/release/ELRdn/SalesGate?label=release)](https://github.com/ELRdn/SalesGate/releases) [![License: MIT](https://img.shields.io/github/license/ELRdn/SalesGate)](LICENSE) [![GHCR](https://img.shields.io/badge/GHCR-ghcr.io%2Felrdn%2Fsalesgate-blue)](https://github.com/ELRdn/SalesGate/pkgs/container/salesgate)

**Human approval infrastructure for AI sales agents.**

Let AI agents research, draft, and prepare outbound actions — while keeping actual execution behind an explicit human approval gate.

```
Agent drafts → SalesGate → Human approves → Locks approved payload → Agent claims (one winner) → Executes → Audited
```

SalesGate sits between AI sales agents and real-world outbound actions. Agents can prepare drafts and request execution, but SalesGate requires explicit human approval, locks the approved payload, prevents conflicting execution, enforces suppression rules, and records what actually happened.

> **Positioning:** SalesGate is **the human approval and execution control layer for AI sales agents** — not a CRM, not an email marketing platform, not a generic AI sales assistant, and not an autonomous sales agent. It adds a safety gate to whatever agent or harness you already use.

---

## How It Works

```
Agent
  │
  │ submit_draft
  ▼
SalesGate
  │
  ├─ Human review
  ├─ Approval / rejection / edit-and-approve
  ├─ Payload integrity lock (SHA-256)
  ├─ Suppression enforcement
  └─ Atomic claim (one winner)
  │
  ▼
Authorized Agent
  │
  │ external action (via harness Gmail MCP / other tool)
  ▼
Gmail / Slack / CRM / External Tool
  │
  ▼
Execution Report / Audit Log (MessageLog + ApprovalItem state)
```

**Constraint by design:** SalesGate does not send email itself. Only the agent that successfully `claim`s an approved item may execute the external action through its own harness (e.g., Gmail MCP). There is no code path for an agent to bypass the gate.

---

## Why SalesGate?

Most AI SDR flows today are:

```
Agent writes something
  → Agent immediately executes
```

That is fast — until an unchecked draft reaches a real prospect.

SalesGate changes the flow to:

```
Agent prepares
  → Human approves
  → Approved payload is locked (canonical SHA-256)
  → One authorized executor claims it
  → Execution happens externally
  → Result is audited
```

Use SalesGate when autonomous agents interact with real leads or external systems and you need a review step that is structurally enforced, not just a prompt instruction.

Comparison:

|  | 11x / Artisan (SaaS) | Typical OSS agent template | **SalesGate** |
|---|---|---|---|
| Sending model | Autonomous | Autonomous | **Approval-first** |
| Harness lock-in | Proprietary | Single-harness | **MCP — any harness** |
| Cost | $2K–5K / month | Free | Free (OSS, MIT) |
| Compliance primitives | Vendor-managed | None | Suppression + audit log built in |

---

## Safety Guarantees (v0.4)

SalesGate's safety model is implemented as state-machine guards, DB transactions, and cryptographic payload checks — not as agent instructions.

### Human approval required

An unapproved item cannot be claimed. `get_approved_send_items` only returns items in `APPROVED` or `EDITED` — `AWAITING_APPROVAL` is never claimable (SG-INV-001).

### Approval locks the action

When a human approves (or edits and approves), SalesGate computes a canonical SHA-256 hash and stores it as `lockedHash`. Any later mutation without re-approval is detectable.

Canonical payload fields:

```
leadId
email   (normalized: trim + lowercase)
subject (normalized: CRLF → LF, trim)
body    (normalized: CRLF → LF, trim)
```

Deterministic serialization: `leadId:{leadId}\nemail:{email}\nsubject:{subject}\n\n{body}` → SHA-256. Legacy `subject+body` hashes are still verified for backward compatibility (SG-INV-002 / SG-INV-003).

### Suppression always wins

If a lead becomes `SUPPRESSED` after approval, the subsequent `claim` is blocked. Suppression is checked both at `submit_draft` time and again inside the claim transaction (SG-INV-004, TOCTOU-safe).

### One executor

Concurrent agents cannot independently execute the same approved action. `get_approved_send_items` uses `prisma.$transaction` + `updateMany where status in [APPROVED, EDITED]` — exactly one winner per item (SG-INV-005).

### Auditable execution

Every execution is attributable. `ApprovalItem.claimedBy / claimedAt / lockedHash / hashMismatchAt` plus `MessageLog.sentBy / sentAt / messageId` record who claimed and what happened. A body mismatch at `report_send_result` time is recorded as `hashMismatchAt` (detection, not prevention — the value is in the audit trail) (SG-INV-006).

> **Permission boundary:** Agents can `submit / claim / report` via MCP. `approve / editAndApprove / reject` are Server Actions in the Web UI only (require `SALESGATE_PASSWORD` session when auth is enabled). There is no MCP tool that lets an agent approve its own draft.

> **Claim crash recovery (v0.4):** A `CLAIMED` item stays locked if the claiming agent crashes (no lease). Recovery is manual via `FAILED → CLAIMED` (agent retry) or `FAILED → APPROVED` (human re-allow). An automatic lease/expiry model is planned for v0.5 as an availability improvement — see [ARCHITECTURE.md](./ARCHITECTURE.md).

Full state machine and invariant table: [ARCHITECTURE.md](./ARCHITECTURE.md#8-safety-invariants-v04).

---

## Features

All items below are verified against the current implementation (v0.4.0).

| Area | Capability |
|---|---|
| **Approval queue** | Review all outbound drafts in one place; approve / reject / edit-and-approve in ~30s per item |
| **Evidence & risk** | Evidence panel ("why this lead") and risk-flag pills surfaced in the review UI |
| **Suppression list** | `SUPPRESSED` leads block submission and claim (GDPR / opt-out primitive) |
| **Daily send cap** | Volume governance to protect deliverability (enforced at claim time) |
| **Audit log** | Full decision history — who submitted, who approved, who claimed, when, and what was sent |
| **Mini-CRM** | Leads, companies, and message history in SQLite; CSV import with duplicate check |
| **Follow-up automation** | Rule-based scheduler — creates follow-up tasks after 3 days of no reply (up to 3 touches) |
| **Task templates** | `MEETING_PREP` / `QUOTE` / `CONTRACT` seed task descriptions automatically |
| **Playbooks** | Export / import / apply configuration packages (via Settings UI and `/api/export/playbook`) |
| **CSV export** | `GET /api/export/logs` — BOM UTF-8, Excel-compatible, last 5,000 rows |
| **Slack notifications** | Webhook notifies on new `AWAITING_APPROVAL` (optional; no-op when not configured) |
| **MCP-native** | Any MCP-capable harness can connect (DSH, OpenClaw, Claude Code, Codex, Pi, Hermes, …) |
| **MCP tools (9)** | `submit_draft`, `list_pending_tasks`, `get_approved_send_items` (atomic claim), `report_send_result` (hash verification), `create_task` / `update_task`, `search_leads` / `update_lead_status`, `request_review` |
| **Agent assignment** | `assignedTo` on tasks + filterable `list_pending_tasks` for parallel multi-agent operation |
| **Lead exclusivity** | One pending outbound per lead — duplicate drafts for the same lead are rejected |
| **Payload integrity** | Canonical SHA-256 lock on approval; verified at `report_send_result` with `hashMismatchAt` audit on mismatch |
| **Sales copy skills** | `skills/sales-email-copy` + `skills/sales-message-review` (SKILL.md, Claude Code-compatible; integrates with `natural-japanese` / `meiseki` for Japanese polishing) |
| **Authentication** | `SALESGATE_PASSWORD` enables Basic Auth (cookie session, 7 days); no auth when unset — intended for local / trusted-network use |
| **Persistence** | SQLite via Prisma 6 + `better-sqlite3` (`prisma/dev.db` locally, `/data/salesgate.db` in Docker) |
| **Deployment** | GHCR prebuilt image + local Node.js + Docker (Compose) — all verified; see Deployment below |

---

## Screenshots

> **Note:** The v2 UI (navy `#0B1320`, 226px sidebar, `lucide-react` icons) shipped in v0.4. If screenshots are not yet updated in this repository, treat any older `zinc-950`-themed captures as outdated. Current UI is the source of truth — see [DESIGN.md](./DESIGN.md) for the authoritative visual spec.
>
> **TODO:** Add current captures for Dashboard (`/`), Approvals (`/approvals`), Leads (`/leads`), Tasks (`/tasks`), and Settings (`/settings`) when available. Do not use generated placeholder images — use real screenshots from a running instance.

Reference prototype capture (archived, for design context only): `salesgate-newui-v2/salesgate-newui-v2/reference/salesgate-vnext-reference.png` (gitignored in production).

---

## Quick Start

### Docker — Recommended (no Git / Node.js / pnpm required)

Requires only **Docker** (and optionally Docker Compose). The image already runs `prisma migrate deploy` on startup and uses `DATABASE_URL=file:/data/salesgate.db`.

```bash
docker run -d \
  --name salesgate \
  -p 3000:3000 \
  -e SALESGATE_PASSWORD=change-this-password \
  -v salesgate-data:/data \
  ghcr.io/elrdn/salesgate:latest
# → http://localhost:3000
```

- Choose a strong, random `SALESGATE_PASSWORD`. `change-this-password` is an obvious placeholder — do not use `password` or `admin`.
- Data persists in the named volume `salesgate-data` (`/data/salesgate.db`).
- `latest` = newest stable release. Pin a version for reproducible deployments:

  ```bash
  docker run -d --name salesgate -p 3000:3000 -e SALESGATE_PASSWORD=change-this-password -v salesgate-data:/data ghcr.io/elrdn/salesgate:v0.4.0
  ```

**Docker Compose (without cloning)** — copy `docker-compose.ghcr.yml` or the snippet below:

```yaml
services:
  salesgate:
    image: ghcr.io/elrdn/salesgate:latest
    ports:
      - "3000:3000"
    environment:
      - SALESGATE_PASSWORD=${SALESGATE_PASSWORD:-}
    volumes:
      - salesgate-data:/data
    restart: unless-stopped

volumes:
  salesgate-data:
```

```bash
SALESGATE_PASSWORD=change-this-password docker compose -f docker-compose.ghcr.yml up -d
# → http://localhost:3000
```

Upgrade (volume survives):

```bash
docker pull ghcr.io/elrdn/salesgate:latest
docker stop salesgate && docker rm salesgate
docker run -d --name salesgate -p 3000:3000 -e SALESGATE_PASSWORD=change-this-password -v salesgate-data:/data ghcr.io/elrdn/salesgate:latest
# Never use `docker compose down -v` during a normal upgrade — -v deletes the database volume.
```

Full Docker details: [docs/docker.md](./docs/docker.md)

---

### From Source — Developers / Contributors

Requires **Git + Node.js 26+ + pnpm 10+** (native type stripping — `import` paths need `.ts` extensions).

```bash
git clone https://github.com/ELRdn/SalesGate.git
cd SalesGate

pnpm install

# Apply schema and seed (SQLite at prisma/dev.db)
pnpm prisma:migrate
pnpm prisma:seed

pnpm dev
# → http://localhost:3000  (falls back to 3001 if 3000 is busy)
#   MCP endpoint: http://localhost:3000/mcp  (or :3001/mcp on fallback)
```

Notes:

- Scripts use **Node.js native type stripping**, not `tsx` — e.g., `node prisma/seed.ts` (already wired in `package.json`).
- `pnpm prisma:generate` regenerates Prisma Client after schema changes.
- SQLite backup: copy `prisma/dev.db` while stopped, or use `VACUUM INTO`.

#### Useful Commands

| Command | Description |
|---|---|
| `pnpm dev` | Next.js dev server + MCP at `/mcp` |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm test` | Unit tests (60 checks) |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm prisma:generate` | Regenerate Prisma Client |
| `pnpm prisma:migrate` | `prisma migrate dev` |
| `pnpm prisma:seed` | `node prisma/seed.ts` |
| `pnpm scheduler` | Run follow-up generation once |
| `pnpm scheduler:watch` | Run scheduler every hour |

#### Source Docker Build (contributors)

```bash
SALESGATE_PASSWORD=change-this-password docker compose build
SALESGATE_PASSWORD=change-this-password docker compose up -d
# → http://localhost:3000  (uses build: . from docker-compose.yml)
```

---

### Authentication

SalesGate runs without auth by default (intended for local use). Set `SALESGATE_PASSWORD` to enable Basic Auth:

```bash
# .env
SALESGATE_PASSWORD=your-long-random-password
```

- Implementation: `src/proxy.ts` (cookie session, 7 days).
- Also works as an env var: `SALESGATE_PASSWORD=xxx pnpm dev` or `docker run -e SALESGATE_PASSWORD=...`.
- See `.env.example`. Slack webhook and other settings are managed separately in `/settings`, not via this variable.

### Settings UI (`/settings`)

- **Slack Webhook URL** — posts to Slack on new `AWAITING_APPROVAL`; empty = disabled (no effect on app behavior).
- **CSV export** — button calls `GET /api/export/logs` (BOM UTF-8, last 5,000 rows).

---

## Docker

See [docs/docker.md](./docs/docker.md) for image tags, Compose files, volume, backup, and architecture notes.

**Local verification (build / runtime / persistence) still passes:**

```bash
docker compose build
docker compose up -d
docker compose ps   # salesgate running
# data persists in salesgate-data volume at /data/salesgate.db
```

Do not claim Vercel support — see Deployment below.

---

## Deployment

| Method | Requirements | Recommended for |
|---|---|---|
| **GHCR Docker image** (`ghcr.io/elrdn/salesgate`) | Docker | Most users — `docker run` or `docker-compose.ghcr.yml` |
| **Source install** (`pnpm dev`) | Git + Node 26+ + pnpm 10+ | Contributors / development |
| **Docker source build** (`docker compose up --build`) | Git + Docker | Development / custom images |

Not supported:

| Environment | v0.4 Support | Notes |
|---|---|---|
| Vercel + local SQLite | ❌ Not supported | SQLite is not persisted on serverless; future `Turso` / `libSQL` planned |
| Multi-tenant SaaS | ❌ Not supported | Single DB file per instance (instance isolation) |

See [SECURITY.md](./SECURITY.md) for exposure warnings. `SALESGATE_PASSWORD` is basic protection for local / trusted-network use — do not expose directly to the public internet without a reverse proxy (TLS, rate limiting) and network ACLs (VPN / Tailscale / Cloudflare Access).

---

## MCP

SalesGate exposes an MCP interface so AI agents can submit drafts, claim approved items, and report results — without ever being able to approve.

| Property | Value |
|---|---|
| SDK | `@modelcontextprotocol/sdk` **1.30.0** (`^1.30.0`) — v1 generation |
| Transport | `WebStandardStreamableHTTPServerTransport` at `/mcp` |
| Route | `src/app/mcp/route.ts` — `GET / POST / DELETE → handleMcpRequest` |
| Server | `McpServer(name: "sales-gate", version: "0.1.0")` — 9 tools |
| Tested protocol behavior | `2025-06-18` (verified via `tests/e2e-mcp.mjs` and `tests/e2e-canonical.mjs`) |
| Session | `mcp-session-id` header + in-memory `Map<sessionId, Transport>` (single-process) |

**Important:** This is intentionally the stable v1 generation. Do not describe it as "latest MCP" or "latest SDK." An upgrade to MCP SDK v2 / MCP `2026-07-28` is planned as a separate v0.5 compatibility migration.

Details and upgrade path: [docs/MCP_COMPATIBILITY.md](./docs/MCP_COMPATIBILITY.md).

### Approval State Machine

```
AWAITING_APPROVAL ─┬─→ APPROVED ─┬─→ CLAIMED ─┬─→ SENT (terminal)
                   ├─→ EDITED  ──┘            └─→ FAILED ─┬─→ CLAIMED (agent retry)
                   ├─→ REJECTED (terminal)                 ├─→ APPROVED (human retry)
                   └─→ ARCHIVED (terminal)                 └─→ ARCHIVED
APPROVED / EDITED / FAILED ─→ ARCHIVED is also allowed
REJECTED / SENT / ARCHIVED are terminal
```

Full transition table and tool I/O: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Agent Setup

SalesGate's MCP endpoint is `http://localhost:3001/mcp` (or `:3000/mcp` — match the port your dev server actually bound to; 3001 is the common fallback when 3000 is occupied, e.g., by Stream Deck).

Multiple harnesses can connect to the same endpoint concurrently — the atomic claim prevents double execution.

| Harness | Status | Guide |
|---|---|---|
| **DSH** (DeepSeek Harness) | ✅ Verified | [docs/setup-dsh.md](./docs/setup-dsh.md) |
| **OpenClaw** | Example configuration (unverified) | [docs/setup-openclaw.md](./docs/setup-openclaw.md) |
| **Claude Code** | Example configuration (unverified) | [docs/setup-claude-code.md](./docs/setup-claude-code.md) |

Do not assume unverified harnesses have been end-to-end tested — they share the same MCP contract but follow the example configs.

**DSH snippet** (`$DSH_HOME/profiles/<profile>/cordis.patch.yml` — use `insert` for new entries):

```yaml
- insert:
    - id: mcp-sales-gate
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: sales-gate
        transport: streamable-http
        url: http://localhost:3001/mcp
```

Changes are applied via HMR (no restart). Open a **new conversation** to see `mcp__sales-gate__submit_draft` and other tools.

Sales copy skills (`skills/sales-email-copy`, `skills/sales-message-review`) are exposed via `skill-filesystem.customSkillDirs` — see [docs/setup-dsh.md](./docs/setup-dsh.md).

---

## Security

`SALESGATE_PASSWORD` (Basic Auth, 7-day cookie session) is **basic protection for local / self-hosted / trusted-network use**. It is not enterprise-grade public-internet authentication (no rate limiting, no 2FA, no brute-force protection).

> **Do not expose the default SalesGate configuration directly to the public internet.**

If you need to expose it beyond `localhost`, put it behind a reverse proxy with TLS and rate limiting, and restrict network access (VPN, Tailscale, Cloudflare Access). Rotate the password regularly and treat exported playbooks and DB dumps as sensitive.

Full policy, reporting instructions, and known limitations: [SECURITY.md](./SECURITY.md).

---

## Architecture

SalesGate is a Next.js 16.3 (App Router) + TypeScript + SQLite (Prisma 6, `better-sqlite3` driver adapter) app that serves both the Web UI and the MCP endpoint from a single process. Key concepts:

- **Approval state machine** — `AWAITING_APPROVAL → APPROVED/EDITED/REJECTED/ARCHIVED → CLAIMED → SENT/FAILED` with terminal-state guards
- **Canonical payload lock** — deterministic SHA-256 over `leadId + email + subject + body`
- **Atomic claim** — transactional `updateMany` guard for exactly-one executor
- **Suppression gate** — checked at submission and re-checked inside the claim transaction
- **MCP execution flow** — `submit_draft → human approve → get_approved_send_items (claim) → external send → report_send_result → MessageLog`
- **SQLite persistence** — `prisma/dev.db` locally, `/data/salesgate.db` in Docker; `Setting` and `Playbook` tables for configuration

Keep this section short — the full design lives in [ARCHITECTURE.md](./ARCHITECTURE.md) and the visual system in [DESIGN.md](./DESIGN.md).

---

## Testing

Verified release acceptance for v0.4.0:

```
Unit tests:        60 passed  (node --test --test-isolation=none)
MCP E2E:           34 passed  (tests/e2e-mcp.mjs)
Canonical E2E:     13 passed  (tests/e2e-canonical.mjs — payload / suppression / concurrent claim)
TypeScript:         0 errors  (pnpm exec tsc --noEmit)
Production Build:   PASS      (pnpm build)
Docker Build:       PASS      (docker compose build)
Docker Runtime:     PASS      (docker compose up -d)
SQLite Persistence: PASS      (volume survives recreate)
```

107 automated checks across unit and E2E suites (60 + 34 + 13).

Run locally:

```bash
pnpm test                                          # unit (60)
pnpm exec tsc --noEmit                             # typecheck

# E2E — start the app first, then in another terminal:
pnpm dev
node tests/e2e-mcp.mjs http://localhost:3001       # 34 checks
node tests/e2e-canonical.mjs http://localhost:3001  # 13 checks
```

E2E requires a seeded DB (`pnpm prisma:seed`) in some cases.

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture, data flow, MCP tool table, DB schema, safety invariants |
| [DESIGN.md](./DESIGN.md) | UI/UX Visual Design System — Single Source of Truth (v2: navy `#0B1320`, sidebar 226px, `lucide-react`) |
| [SECURITY.md](./SECURITY.md) | Security policy, deployment warnings, credential handling, known limitations |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development setup, scripts, project principles, PR guide |
| [roadmap.md](./roadmap.md) | Milestones from v0.1 to v0.4 and beyond |
| [docs/docker.md](./docs/docker.md) | GHCR image, tags, `docker run` / Compose, volume, upgrade, backup |
| [docs/MCP_COMPATIBILITY.md](./docs/MCP_COMPATIBILITY.md) | SDK 1.30 / Streamable HTTP status and upgrade path |
| [docs/setup-dsh.md](./docs/setup-dsh.md) | DSH setup (verified) |
| [docs/setup-openclaw.md](./docs/setup-openclaw.md) | OpenClaw setup (example / unverified) |
| [docs/setup-claude-code.md](./docs/setup-claude-code.md) | Claude Code setup (example / unverified) |
| [docs/skill-comparison.md](./docs/skill-comparison.md) | Sales copy skill v0 vs v1 comparison |

---

## Roadmap

Brief direction — see [roadmap.md](./roadmap.md) for the full plan.

**v0.4** (shipped): OSS release hardening — MIT license, safety hardening (SG-INV-003/004/005), v2 UI (navy + sidebar + lucide), Docker persistence, DSH verified, docs and deployment guides.

**v0.5 candidates** (tracked in `roadmap.md` and related docs):

- MCP SDK v2 / MCP `2026-07-28` compatibility migration (planned separately; v0.4 stays on v1 generation) — see [docs/MCP_COMPATIBILITY.md](./docs/MCP_COMPATIBILITY.md)
- Multi-tenant via instance isolation (1 tenant = 1 DB file) — deferred from v0.4, documented as v0.5 candidate in [roadmap.md](./roadmap.md)
- Claim lease / recovery improvements and stronger remote authentication are discussed as future hardening in [ARCHITECTURE.md](./ARCHITECTURE.md) (Claim Crash Recovery) and [SECURITY.md](./SECURITY.md)

No additional promises are made beyond what `roadmap.md` tracks.

---

## License

MIT — see [LICENSE](./LICENSE).

Copyright (c) 2026 SalesGate Contributors.
