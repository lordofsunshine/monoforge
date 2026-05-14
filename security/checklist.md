# MonoForge Security Checklist

## Upload
- Stream multipart uploads into `/storage/tmp`.
- Enforce upload, repository, user quota and concurrent upload limits.
- Block forbidden extensions: `.exe`, `.dll`, `.bat`, `.cmd`, `.msi`, `.scr`, `.com`, `.jar`, `.sh`.
- Normalize repository paths and reject traversal, null bytes, absolute paths and server path prefixes.
- Store files on disk only; PostgreSQL stores metadata.

## Download And Raw
- Re-check repository visibility on every raw/download/preview/thumbnail request.
- Stream raw/download responses.
- Use attachment disposition for downloads.
- Do not render binary files as text.

## Markdown
- Do not enable raw HTML rendering.
- Sanitize dangerous link schemes.
- External links use `target="_blank"` with `rel="noopener noreferrer"`.

## Auth And API
- Auth.js sessions protect private routes.
- Route handlers re-check authorization instead of relying only on proxy.
- Rate limits exist for login, register, upload, issues, comments, search and stars.
- Secure headers are added in `proxy.ts`.

## Audit
- Audit dangerous actions: repository delete, visibility changes, rename, large upload, failed login, file delete and quota exceeded.
- User-facing errors stay short; server details go to logs.

## Operational
- Run cleanup of tmp files and orphan blobs.
- Back up PostgreSQL and storage together.
- Keep `.env` out of source control.
