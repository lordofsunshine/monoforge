#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: scripts/restore-db.sh backups/monoforge-db.sql"
  exit 1
fi

docker compose exec -T postgres psql -U "${POSTGRES_USER:-monoforge}" "${POSTGRES_DB:-monoforge}" < "$1"
echo "Restored $1"
