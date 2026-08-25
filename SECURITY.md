# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| `v0.4.x` (RC) | ✅ |
| `< 0.4` | ❌ (pre-release) |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

- Open a private security advisory on GitHub (preferred), or
- Contact the maintainers via the repository's security tab.

We will acknowledge within 72 hours and aim to provide a fix or mitigation within 14 days. Please do not disclose the issue publicly until we have had a chance to address it.

**Do not include real credentials, API keys, or production database dumps in reports.**

## Deployment Warning

> **Do not expose the default SalesGate configuration directly to the public internet without additional protection.**

- The default `SALESGATE_PASSWORD` (Basic Auth, cookie 7 days) is intended for **local / trusted-network / self-host basic protection** only. It is not enterprise-grade remote authentication (no rate limiting, no 2FA, no brute-force protection).
- If you expose SalesGate beyond localhost, put it behind a reverse proxy with TLS, rate limiting, and network ACLs (e.g., VPN, Tailscale, Cloudflare Access).
- Change `SALESGATE_PASSWORD` to a long, random value and rotate regularly.

## Credential Handling

- Secrets are loaded from environment variables (`.env` is gitignored). Never commit `.env`, tokens, or API keys.
- Slack Webhook URL is stored in the `Setting` table. Treat exported playbooks and DB dumps as sensitive.
- Back up `prisma/dev.db` (SQLite) regularly and encrypt backups at rest.

## MCP Authorization Assumptions

- MCP tools (`submit_draft`, `get_approved_send_items`, etc.) currently share no per-agent RBAC beyond `agentName` attribution. Any client that can reach `/mcp` can submit drafts and claim approved items.
- **Approval itself is human-only** via Server Actions (requires `SALESGATE_PASSWORD` session when auth is enabled). Agents cannot call `approve` via MCP.
- For multi-agent setups, treat the MCP endpoint as trusted-network-only. Future versions will add scoped credentials.

## SQLite Backup Recommendation

- `prisma/dev.db` is a single file. Copy it while the app is stopped, or use SQLite's `VACUUM INTO` for hot backups.
- In Docker, mount `/data` as a persistent volume (see `docker-compose.yml`).

## Known Limitations (v0.4)

- No per-tenant isolation (single DB file).
- No claim lease/expiry — a crashed agent's `CLAIMED` item stays locked until manual retry (see `ARCHITECTURE.md`).
- Vercel-style serverless is not officially supported with local SQLite (requires external DB like Turso/libSQL).
