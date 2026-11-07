"""Real file-backed SQLite, independent processes; uses only a temporary database."""

import concurrent.futures, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def shell(env, code):
    result = subprocess.run(
        [PYTHON, str(ROOT / "backend/manage.py"), "shell", "-c", code],
        env=env,
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout.strip().splitlines()[-1])


with tempfile.TemporaryDirectory(prefix="vitrix-sqlite-test-") as directory:
    root = Path(directory)
    env = {
        **os.environ,
        "DJANGO_DEBUG": "1",
        "DATABASE_PATH": str(root / "db.sqlite3"),
        "MEDIA_ROOT": str(root / "media"),
        "DJANGO_SECRET_KEY": "isolated-concurrency-test-secret",
    }
    subprocess.run(
        [PYTHON, str(ROOT / "backend/manage.py"), "migrate", "--noinput"],
        env=env,
        cwd=ROOT,
        check=True,
        stdout=subprocess.DEVNULL,
    )
    fixture = shell(
        env,
        "from accounts.models import *; from django.contrib.auth import get_user_model; import json; u=get_user_model().objects.create_user('concurrent','concurrent@example.com'); b=ensure_business(u); a=get_user_model().objects.create_superuser('operator','operator@example.com','test-only-987!'); print(json.dumps({'business':str(b.pk),'admin':a.pk,'expires':b.expires.isoformat()}))",
    )
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(
            pool.map(
                lambda _: shell(
                    env,
                    "from accounts.security import allow; import json; print(json.dumps(sum(allow('parallel','same-account',50,600) for _ in range(40))))",
                ),
                range(2),
            )
        )
    assert sum(results) == 50, results
    shell(
        env,
        "from accounts.models import EmailCode; from django.utils import timezone; from datetime import timedelta; from django.contrib.auth.hashers import make_password; import json; EmailCode.objects.create(email='concurrent@example.com',purpose='reset',digest=make_password('123456'),expires_at=timezone.now()+timedelta(minutes=10)); print(json.dumps(True))",
    )
    code = """from django.db import transaction
from accounts.views import consume_code
import json
with transaction.atomic():
    code=consume_code('concurrent@example.com','reset','123456')
    ok=not isinstance(code,str)
    if ok:code.delete()
print(json.dumps(ok))"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: shell(env, code), range(2)))
    assert sum(results) == 1, results
    import uuid

    payload = {
        "planId": "pro",
        "months": 1,
        "mode": "extend",
        "note": "parallel retry",
        "idempotencyKey": str(uuid.uuid4()),
    }
    code = f"from django.test import Client; from django.contrib.auth import get_user_model; import json; c=Client(); c.force_login(get_user_model().objects.get(pk={fixture['admin']})); r=c.post('/api/v1/admin/businesses/{fixture['business']}/subscription/',json.dumps({payload!r}),content_type='application/json'); print(json.dumps(r.status_code))"
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: shell(env, code), range(2)))
    assert results == [200, 200], results
    assert (
        shell(
            env,
            "from accounts.models import SubscriptionActivation; import json; print(json.dumps(SubscriptionActivation.objects.count()))",
        )
        == 1
    )
    shell(
        env,
        "from accounts.models import *; import json; b=Business.objects.first(); p=Plan.objects.get(pk='starter'); p.limit=1; p.save(); b.plan=p; b.save(); print(json.dumps(True))",
    )

    def quota_worker(n):
        data = {
            "changes": [
                {
                    "entity": "products",
                    "op": "upsert",
                    "record": {
                        "id": f"quota-{n}",
                        "businessId": fixture["business"],
                        "name": "Quota product",
                        "slug": f"quota-{n}",
                        "price": 1,
                    },
                }
            ]
        }
        command = f"from django.test import Client; from django.contrib.auth import get_user_model; import json; c=Client(); c.force_login(get_user_model().objects.get(username='concurrent')); r=c.patch('/api/v1/workspace/',json.dumps({data!r}),content_type='application/json'); print(json.dumps(r.status_code))"
        return shell(env, command)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        quota_results = list(pool.map(quota_worker, range(2)))
    assert sorted(quota_results) == [200, 400], quota_results
    subprocess.run(
        [
            PYTHON,
            str(ROOT / "backend/manage.py"),
            "backup_sqlite",
            str(root / "backup"),
        ],
        env=env,
        cwd=ROOT,
        check=True,
        stdout=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            PYTHON,
            str(ROOT / "backend/manage.py"),
            "verify_backup",
            str(root / "backup"),
        ],
        env=env,
        cwd=ROOT,
        check=True,
        stdout=subprocess.DEVNULL,
    )
    restored = {
        **env,
        "DATABASE_PATH": str(root / "backup/db.sqlite3"),
        "MEDIA_ROOT": str(root / "backup/media"),
    }
    assert (
        shell(
            restored,
            "from django.test import Client; import json; print(json.dumps(Client().get('/api/v1/health/').status_code))",
        )
        == 200
    )
    print(
        json.dumps(
            {
                "shared_rate_limit": "50/80 across two processes",
                "otp_consumed_once": True,
                "concurrent_quota_enforced": True,
                "activation_idempotent": True,
                "backup_restored_health": 200,
            }
        )
    )
