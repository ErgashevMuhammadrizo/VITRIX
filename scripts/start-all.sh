#!/usr/bin/env bash
set -Eeuo pipefail
backend_pid=""
frontend_pid=""
media_pid=""
cleanup() {
  trap - EXIT TERM INT
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  [[ -z "$media_pid" ]] || kill "$media_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' TERM INT
export DJANGO_API_URL="${DJANGO_API_URL:-http://127.0.0.1:9000}"
export DATABASE_PATH="${DATABASE_PATH:-/data/db.sqlite3}"
export MEDIA_ROOT="${MEDIA_ROOT:-/data/media}"
mkdir -p "$(dirname "$DATABASE_PATH")" "$MEDIA_ROOT"
# Immutable UUID images are served independently of the Django worker.
if command -v nginx >/dev/null; then
  export MEDIA_INTERNAL_URL=http://127.0.0.1:9100
  cat > /tmp/vitrix-nginx.conf <<NGINX
pid /tmp/vitrix-nginx.pid;
events { worker_connections 256; }
http { include /etc/nginx/mime.types; access_log off; server { listen 127.0.0.1:9100; location /media/ { alias ${MEDIA_ROOT}/; add_header Cache-Control "public, max-age=31536000, immutable"; add_header X-Content-Type-Options nosniff; } } }
NGINX
  nginx -c /tmp/vitrix-nginx.conf -g 'daemon off;' &
  media_pid=$!
fi
cd /app/backend
/opt/venv/bin/python manage.py migrate --noinput
/opt/venv/bin/python manage.py collectstatic --noinput
/opt/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:9000 --workers 1 --threads 4 --timeout 60 --access-logfile - --error-logfile - &
backend_pid=$!
cd /app
./node_modules/.bin/next start --hostname 0.0.0.0 --port "${PORT:-8080}" &
frontend_pid=$!
set +e
pids=("$backend_pid" "$frontend_pid")
[[ -z "$media_pid" ]] || pids+=("$media_pid")
wait -n "${pids[@]}"
status=$?
set -e
[[ "$status" -ne 0 ]] || status=1
exit "$status"
