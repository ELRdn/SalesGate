# Docker — SalesGate

Prebuilt images are published to GitHub Container Registry (GHCR). You need only Docker — no Git, Node.js, or pnpm required.

## Image

```
ghcr.io/elrdn/salesgate
Registry: GHCR (ghcr.io)
Source:   https://github.com/ELRdn/SalesGate
License:  MIT
```

> GHCR normalizes the repository name to lowercase (`elrdn/salesgate`).

## Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `latest` | Newest stable release | `ghcr.io/elrdn/salesgate:latest` |
| `v0.4.0` | Exact release (with `v`) | `ghcr.io/elrdn/salesgate:v0.4.0` |
| `0.4.0`  | Exact release (without `v`) | `ghcr.io/elrdn/salesgate:0.4.0` |
| `0.4`    | Latest `0.4.x` patch | `ghcr.io/elrdn/salesgate:0.4` |

Minimum guaranteed for every stable release: `vX.Y.Z`, `X.Y.Z`, `latest`. `0.4` / `0` are also published when cleanly supported.

Prereleases / drafts (e.g., `v0.5.0-beta`) are published without `latest`.

## Quick Start — `docker run`

```bash
docker run -d \
  --name salesgate \
  -p 3000:3000 \
  -e SALESGATE_PASSWORD=change-this-password \
  -v salesgate-data:/data \
  ghcr.io/elrdn/salesgate:latest
# → http://localhost:3000
```

Notes:

- No manual Prisma command is needed. The image runs `prisma migrate deploy` on startup, then `next start`.
- `DATABASE_URL=file:/data/salesgate.db` is set inside the image; `/data` is the persistent volume.
- Choose a strong, random `SALESGATE_PASSWORD`. `change-this-password` is an obvious placeholder — do not use `password` or `admin`.

Pinned version (reproducible):

```bash
docker run -d \
  --name salesgate \
  -p 3000:3000 \
  -e SALESGATE_PASSWORD=change-this-password \
  -v salesgate-data:/data \
  ghcr.io/elrdn/salesgate:v0.4.0
```

## Quick Start — Docker Compose (without git clone)

You do not need to clone the repository to run the image.

`docker-compose.ghcr.yml` (provided in this repo) for end users:

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

Run:

```bash
# with a local compose file (no git needed — copy the YAML above)
SALESGATE_PASSWORD=change-this-password docker compose -f docker-compose.ghcr.yml up -d
# or using the file from a clone:
SALESGATE_PASSWORD=change-this-password docker compose -f docker-compose.ghcr.yml up -d
```

Contributor compose (`docker-compose.yml` with `build: .`) remains for local development / custom images.

## Persistent Volume

- Named volume: `salesgate-data` → mounted at `/data` → SQLite at `/data/salesgate.db`.
- Data survives `docker stop` / `docker rm` / `docker compose down` (without `-v`).
- To reset (delete DB):

  ```bash
  docker compose down -v   # deletes the volume — use only when you intend to reset
  ```

## Upgrade

```bash
docker pull ghcr.io/elrdn/salesgate:latest   # or :v0.5.0 for a pinned upgrade
docker stop salesgate
docker rm salesgate
docker run -d --name salesgate -p 3000:3000 -e SALESGATE_PASSWORD=change-this-password -v salesgate-data:/data ghcr.io/elrdn/salesgate:latest
```

For Compose:

```bash
docker compose -f docker-compose.ghcr.yml pull
SALESGATE_PASSWORD=change-this-password docker compose -f docker-compose.ghcr.yml up -d
```

The `salesgate-data` volume is reused — your leads and approvals persist. Never use `down -v` during a normal upgrade.

Pin stable deployments to `v0.4.0` rather than following `latest` blindly; use `latest` only if you want automatic tracking of the newest stable release.

## Backup & Restore

SQLite is a single file at `/data/salesgate.db` inside the volume.

```bash
# backup (stop container first for consistency, or use VACUUM INTO)
docker stop salesgate
docker run --rm -v salesgate-data:/data -v $(pwd):/backup alpine cp /data/salesgate.db /backup/salesgate-$(date +%Y%m%d).db
docker start salesgate
```

Restore by copying the file back into the volume while stopped.

## Supported Architectures

- `linux/amd64` — verified (Node 26 + `better-sqlite3` native build)
- `linux/arm64` — not published for v0.4 (not yet verified). If added in the future it will be documented here.

Correctness is prioritized over a multi-arch badge.

## GHCR Source & Publishing

- Workflow: `.github/workflows/publish-container.yml`
- Triggers: `release` (published) and `workflow_dispatch` (manual, e.g., `v0.4.0`)
- Built with Docker Buildx, OCI labels via `docker/metadata-action`, cache via `type=gha`.
- After the first publish, make the package **Public** once (see below) so `docker pull` works without login:

  ```
  GitHub → ELRdn / SalesGate → Packages → salesgate → Package settings → Change visibility → Public
  ```

## Security Reminder

`SALESGATE_PASSWORD` is basic protection for local / trusted-network / self-host use (Basic Auth, 7-day cookie, no rate limiting / 2FA). Do not expose SalesGate directly to the public internet without a reverse proxy (TLS, rate limiting) and network ACLs (VPN / Tailscale / Cloudflare Access). See `SECURITY.md`.

