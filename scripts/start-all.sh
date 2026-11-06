#!/usr/bin/env bash
set -Eeuo pipefail
backend_pid=""
frontend_pid=""
cleanup() {
  trap - EXIT TERM INT
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' TERM INT
export DJANGO_API_URL="${DJANGO_API_URL:-http://127.0.0.1:9000}"
export DATABASE_PATH="${DATABASE_PATH:-/data/db.sqlite3}"
export MEDIA_ROOT="${MEDIA_ROOT:-/data/media}"
mkdir -p "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT"
cd /app/backend
/opt/venv/bin/python manage.py migrate --noinput
/opt/venv/bin/python manage.py collectstatic --noinput
/opt/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:9000 --workers 1 --timeout 60 --access-logfile - --error-logfile - &
backend_pid=$!
cd /app
./node_modules/.bin/next start --hostname 0.0.0.0 --port "${PORT:-8080}" &
frontend_pid=$!
set +e
wait -n "$backend_pid" "$frontend_pid"
status=$?
set -e
[[ "$status" -ne 0 ]] || status=1
exit "$status"
