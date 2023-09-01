#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

echo "Load seed database in postgres and postgres test datatbase"
docker compose exec postgres sh -c "cd /sqls/ && psql --quiet -U \$POSTGRES_USER \$POSTGRES_DB -f /sqls/seed.sql"

