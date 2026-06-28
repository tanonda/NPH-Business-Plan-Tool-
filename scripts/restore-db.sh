#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_FILE="${1:-}"
if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "Usage: ./scripts/restore-db.sh <backup.sql.gz|backup.sql>" >&2
  exit 1
fi

read -r -p "This will restore into DATABASE_URL and may overwrite data. Type RESTORE to continue: " CONFIRM
if [[ "$CONFIRM" != "RESTORE" ]]; then
  echo "Restore cancelled."
  exit 1
fi

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

echo "Restore completed."
