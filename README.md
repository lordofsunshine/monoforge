# MonoForge

Minimal monochrome GitHub-like forge for repositories, files, README covers, issues, stars, activity and storage discipline.

MonoForge is built for small servers. It stores file metadata in PostgreSQL, stores file bytes on disk under `/storage`, deduplicates blobs by SHA-256, compresses text with zstd, and creates optimized image previews with sharp.

## Features

- Auth.js email/password login and registration.
- User profiles and profile settings.
- Public/private repositories.
- File upload, delete, file tree and raw/download streaming.
- `RepositoryFile` metadata plus deduplicated `FileBlob` storage.
- SHA-256 hash-based storage: `/storage/blobs/aa/bb/<sha256>.zst`.
- zstd compression for text-like files.
- sharp-powered image preview and thumbnail variants.
- README preview as a project cover.
- Markdown rendering with GFM and XSS-safe defaults.
- Code viewer with syntax highlighting, metadata, raw/download/copy actions.
- Issues, comments, labels, board and maintainer notes.
- Stars with optimistic UI and strict monochrome counters.
- Activity feed and activity pulse.
- Storage quota, storage savings and repo health metrics.
- Global search and terminal-style command palette.
- Light/dark theme and focus-mode hooks.
- Docker Compose deployment for a small VPS.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS v4
- PostgreSQL
- Prisma ORM
- Auth.js / NextAuth
- zod
- zstd CLI
- sharp
- Docker Compose

Copy `.env.example` to `.env` and change secrets.

```bash
DATABASE_URL="postgresql://monoforge:monoforge@localhost:5432/monoforge?schema=public"
AUTH_SECRET="replace-with-a-strong-random-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
STORAGE_PATH="./storage"
MAX_UPLOAD_SIZE_MB="10"
MAX_REPO_SIZE_MB="200"
MAX_USER_STORAGE_MB="1024"
MAX_FILES_PER_REPO="1000"
MAX_CONCURRENT_UPLOADS="2"
ZSTD_LEVEL="3"
IMAGE_MAX_WIDTH="1600"
IMAGE_QUALITY="82"
```

## Local Development

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Docker Development

```bash
docker compose up -d --build
docker compose logs -f
docker compose exec app npm run prisma:migrate
docker compose exec app npm run prisma:seed
```

## Production Deployment

1. Create `.env` from `.env.example`.
2. Set a strong `AUTH_SECRET`.
3. Point DNS/SSL reverse proxy to the app.
4. Run:

```bash
docker compose up -d --build
docker compose exec app npm run prisma:migrate
```

`deploy/Caddyfile` contains a small reverse-proxy example with upload size, compression and security headers.

## Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

For local schema iteration:

```bash
npm run db:migrate
```

## Backup And Restore

Database backup:

```bash
scripts/backup-db.sh
```

Storage backup:

```bash
tar -czf backups/monoforge-storage-$(date +%Y%m%d-%H%M%S).tar.gz storage
```

Restore database:

```bash
scripts/restore-db.sh backups/monoforge-db.sql
```

Restore storage:

```bash
tar -xzf backups/monoforge-storage.tar.gz
```

Back up PostgreSQL and storage close together so database metadata matches blobs.

## Cleanup

```bash
npm run cleanup:tmp
npm run cleanup:orphan-blobs
npm run storage:stats
```

Docker:

```bash
docker compose exec app npm run cleanup:tmp
docker compose exec app npm run cleanup:orphan-blobs
docker compose exec app npm run storage:stats
```

## GitHub Mirror Crawler

A temporary, admin-toggleable worker that scans newly created public GitHub repositories, keeps only those under a permissive license, and mirrors each one into MonoForge: it creates a non-login bot account named after the GitHub owner, creates a repository named after the GitHub repository, and imports all files. A separate ledger (`MirroredRepository`) records every processed GitHub repository id so nothing is imported twice.

Run the worker:

```bash
npm run mirror:worker
```

Docker:

```bash
docker compose exec app npm run mirror:worker
```

Control:

- Enable or disable it from the admin page (`/admin`). The worker polls the flag each cycle, so it pauses and resumes without a restart. It starts disabled.
- Without `GITHUB_TOKEN` the GitHub API allows ~60 requests/hour, so throughput is roughly 50 repositories/hour. Set `GITHUB_TOKEN` to raise the limit to 5000 requests/hour.
- Allowed licenses are defined in `server/mirror/licenses.ts`. Copyleft licenses are skipped by default.
- Mirror accounts have no password and cannot sign in. Each mirrored repository keeps its `LICENSE` file and stores the original GitHub URL as attribution.

Relevant environment variables: `GITHUB_TOKEN`, `GITHUB_API_USER_AGENT`, `MIRROR_INTERVAL_MS`, `MIRROR_BATCH_SIZE`, `MIRROR_MAX_REPO_MB`, `MIRROR_MAX_FILE_MB`, `MIRROR_MIN_RATE_BUDGET`.

## Roadmap

- Real Git push/pull via system `git`/simple-git.
- Bare repositories in `/storage/git/<owner>/<repo>.git`.
- Branches, commit browser and diff viewer.
- Pull requests.
- SSH keys and deploy tokens.
- Collaborators and organization-like spaces.
- CI/CD hooks.

## Troubleshooting

- If zstd compression fails, install the `zstd` binary on the host or use Docker.
- If image previews fail, check sharp native dependencies and storage permissions.
- If Prisma cannot connect, verify `DATABASE_URL` and Postgres health.
- If raw/download returns 404, check repository visibility and `RepositoryFile.blobId`.
- If storage looks inconsistent, run `npm run storage:stats` and `npm run cleanup:orphan-blobs`.