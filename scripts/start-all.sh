#!/usr/bin/env bash
set -Eeuo pipefail

backend_pid=""
frontend_pid=""

cleanup() {
  trap - EXIT TERM INT
  if [[ -n "$frontend_pid" ]]; then
    kill "$frontend_pid" 2>/dev/null || true
  fi
  if [[ -n "$backend_pid" ]]; then
    kill "$backend_pid" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap cleanup EXIT
trap 'exit 0' TERM INT

mkdir -p /data/media

cd /app/backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn config.wsgi:application \
  --bind 127.0.0.1:9000 \
  --workers 1 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile - &
backend_pid=$!

cd /app
./node_modules/.bin/next start \
  --hostname 0.0.0.0 \
  --port "${PORT:-8080}" &
frontend_pid=$!

set +e
wait -n "$backend_pid" "$frontend_pid"
status=$?
set -e

# Bitta server to‘xtasa, konteyner qayta ishga tushirilishi kerak.
if [[ "$status" -eq 0 ]]; then
  status=1
fi
exit "$status"