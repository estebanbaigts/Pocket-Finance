#!/usr/bin/env bash
# Applique les migrations sur un PostgreSQL local jetable puis exécute les tests de sécurité (RLS).
# Prérequis : binaires PostgreSQL (initdb, pg_ctl, psql) — ex. `brew install postgresql@15`.
set -euo pipefail
export LC_ALL=C LANG=C
cd "$(dirname "$0")/../.."
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb || echo /opt/homebrew/opt/postgresql@15/bin/initdb)")}"
PORT="${PG_TEST_PORT:-54329}"
DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pocket-pg.XXXXXX")"
cleanup() { "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m immediate stop >/dev/null 2>&1 || true; }
trap cleanup EXIT

"$PG_BIN/initdb" -D "$DATA_DIR" -U postgres --auth=trust --no-locale --encoding=UTF8 >/dev/null
"$PG_BIN/pg_ctl" -D "$DATA_DIR" -o "-p $PORT -k $DATA_DIR -c listen_addresses=''" -l "$DATA_DIR/log" start >/dev/null
PSQL=("$PG_BIN/psql" -h "$DATA_DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f db/tests/supabase_stub.sql
for migration in db/migrations/*.sql; do
  echo "→ $migration"
  "${PSQL[@]}" -f "$migration"
done
"${PSQL[@]}" -o /dev/null -f db/tests/rls_test.sql
