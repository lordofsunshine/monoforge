# MonoForge Git V2 Architecture

MonoForge MVP intentionally uses `RepositoryFile`, `FileBlob` and `CommitLite` instead of real Git hosting. This keeps the first version small enough for a limited VPS.

## Approach Comparison

| Approach | Pros | Cons | Fit |
| --- | --- | --- | --- |
| isomorphic-git | Pure JavaScript, works in Node.js | Not ideal as a full Git hosting transport | Good for import/export and browser-like tooling |
| simple-git/system git | Real Git behavior, mature tooling | Requires `git` binary and process limits | Best v2 path for a small server |
| Gitea backend | Production Git hosting exists already | MonoForge becomes a wrapper | Fallback if full Git hosting is needed quickly |
| Custom Git HTTP server | Full control | Complex and risky | Not for MVP |

## Recommended Path

1. MVP: keep CommitLite and FileBlob.
2. v2: add bare repositories under `/storage/git/<owner>/<repo>.git` using system `git` through a small service wrapper.
3. v3: add branches, diffs and pull requests.
4. Use Gitea only if production-grade Git transport becomes more important than owning the stack.

## Migration

1. Create a temporary working tree from current `RepositoryFile` rows.
2. Stream each `FileBlob` into the working tree without loading large files into memory.
3. Initialize a Git repository, commit files using synthetic authors from `CommitLite`.
4. Convert it to a bare repository in `/storage/git/<owner>/<repo>.git`.
5. Set `Repository.gitEnabled = true` and `Repository.gitPath`.
6. Keep FileBlob metadata as the web preview cache until Git becomes canonical.

## Safety

- Limit git process runtime with `AbortController`/process kill.
- Run only allowlisted git commands.
- Set max `.git` size per repository.
- Run `git gc --auto` after push and scheduled `git gc` off-peak.
- Recalculate repository quota after every push.
- Reject pushes that exceed user or repo quotas.
- Log dangerous operations in `AuditLog`.

## Future Schema

Already prepared:
- `Repository.gitEnabled`
- `Repository.gitPath`
- `Repository.defaultBranch`

Future models:
- `GitCredential`: token/SSH key metadata, hashed secret, scopes, lastUsedAt.
- `Branch`: repositoryId, name, headSha, protected.
- `PullRequest`: repositoryId, sourceBranch, targetBranch, authorId, status.
- `DiffCache`: commitSha/baseSha/headSha, compressed diff summary, expiresAt.

## Auth

- HTTPS clone/push can use `ApiToken` or future `GitCredential`.
- SSH support should store public keys and never store private keys.
- Push requires owner/collaborator write permission.
- Clone checks public/private repository access.
