#!/usr/bin/env bash
# ISOLATED local Next+Django test. Uses file email; never sends real messages.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
mkdir -p .sites-runtime
qa_dir=$(mktemp -d "$PWD/.sites-runtime/live-smoke.XXXXXX")
qa_python="${VITRIX_TEST_PYTHON:-backend/.venv/bin/python}"
qa_backend_pid=""
qa_frontend_pid=""
cleanup() {
  [[ -z "$qa_backend_pid" ]] || kill "$qa_backend_pid" 2>/dev/null || true
  [[ -z "$qa_frontend_pid" ]] || kill "$qa_frontend_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
export DJANGO_DEBUG=1 DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,testserver DJANGO_SECURE_COOKIES=0
export DATABASE_PATH="$qa_dir/db.sqlite3" MEDIA_ROOT="$qa_dir/media"
export EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend EMAIL_FILE_PATH="$qa_dir/outbox" VITRIX_SMOKE_OUTBOX="$qa_dir/outbox"
export DJANGO_API_URL=http://127.0.0.1:16999 SITE_URL=http://127.0.0.1:18080
"$qa_python" backend/manage.py migrate --noinput > "$qa_dir/migrations.log" 2>&1
"$qa_python" backend/manage.py runserver 127.0.0.1:16999 --noreload > "$qa_dir/django.log" 2>&1 &
qa_backend_pid=$!
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 18080 > "$qa_dir/next.log" 2>&1 &
qa_frontend_pid=$!
"$qa_python" - <<'PY'
import time,urllib.request
for attempt in range(40):
 try:
  if urllib.request.urlopen('http://127.0.0.1:18080/api/v1/health/',timeout=1).status==200:break
 except Exception:time.sleep(.25)
else:raise SystemExit('Local test servers did not become ready')
PY
"$qa_python" scripts/api-smoke.py http://127.0.0.1:18080
node scripts/smoke.mjs http://127.0.0.1:18080
