#!/usr/bin/env sh
set -eu

mkdir -p backups
timestamp="$(date +%Y%m%d-%H%M%S)"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-monoforge}" "${POSTGRES_DB:-monoforge}" > "backups/monoforge-db-${timestamp}.sql"
echo "Created backups/monoforge-db-${timestamp}.sql"
