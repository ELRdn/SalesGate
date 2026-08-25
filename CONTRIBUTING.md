# Contributing to SalesGate

Thanks for considering a contribution!

## Development Setup

```bash
git clone https://github.com/your-org/salesgate.git
cd salesgate
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
# → http://localhost:3000 (or 3001 if 3000 is busy)
```

Requirements: **Node.js 26+** (native type stripping), **pnpm 10+**.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Next.js dev server + MCP at `/mcp` |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests (`node --test`) |
| `pnpm prisma:generate` | Regenerate Prisma Client |
| `pnpm scheduler` | Run follow-up generation once |
| `pnpm scheduler:watch` | Run scheduler every hour |

## E2E (MCP)

```bash
# Terminal 1
pnpm dev
# Terminal 2
node tests/e2e-mcp.mjs http://localhost:3001
```

## Project Principles

- **Approval-first**: No external send without human approval.
- **App never sends**: Sending is via the agent's Gmail MCP after claim.
- **Idempotent claim**: One executor per approved item.
- See `ARCHITECTURE.md` and `DESIGN.md` for details. If your change conflicts with `DESIGN.md`, update the doc first.

## Pull Requests

1. Fork and create a feature branch.
2. Keep changes focused; include tests for safety-critical paths (`tests/`).
3. Run `pnpm exec tsc --noEmit` and `pnpm test` before submitting.
4. Update docs (`DESIGN.md` / `ARCHITECTURE.md` / `roadmap.md`) when behavior changes.

## Commit Messages

- Use Japanese for docs/commits where appropriate (project convention).
- Prefer conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
