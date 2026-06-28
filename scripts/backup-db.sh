#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/vnh-business-plan-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$OUT"
echo "Backup written: $OUT"
