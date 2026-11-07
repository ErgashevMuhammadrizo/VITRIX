"""Rehearse upgrading a populated v4 schema in an isolated temporary SQLite DB."""

import json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(env, args):
    return subprocess.run(
        [sys.executable, str(ROOT / "backend/manage.py"), *args],
        env=env,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )


with tempfile.TemporaryDirectory(prefix="vitrix-upgrade-") as directory:
    env = {
        **os.environ,
        "DJANGO_DEBUG": "1",
        "DATABASE_PATH": str(Path(directory) / "db.sqlite3"),
    }
    run(env, ["migrate", "accounts", "0007_plan_prices", "--noinput"])
    run(
        env,
        [
            "shell",
            "-c",
            """from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
apps=MigrationExecutor(connection).loader.project_state([('accounts','0007_plan_prices')]).apps
U=apps.get_model('auth','User');B=apps.get_model('accounts','Business');P=apps.get_model('accounts','Product');Profile=apps.get_model('accounts','AccountProfile')
u=U.objects.create(username='legacy',email='legacy@example.test',password=make_password('Legacy-verified-987!'))
trial=timezone.now()-timedelta(days=15);Profile.objects.create(user_id=u.pk,trial_started_at=trial)
b=B.objects.create(id='legacy-business',owner_id=u.pk,name='Legacy shop',slug='legacy_shop',plan_id='vip',expires=trial+timedelta(days=90),trialStartedAt=trial,primary='#654321',theme='elegant')
P.objects.create(id='legacy-product',business_id=b.pk,name='Legacy product',slug='legacy-product',price='12345.67')
print('fixture created')""",
        ],
    )
    run(env, ["migrate", "--noinput"])
    result = run(
        env,
        [
            "shell",
            "-c",
            """from accounts.models import Business,Product,AccountProfile,Plan
from django.contrib.auth import get_user_model
from datetime import timedelta
import json
u=get_user_model().objects.get(username='legacy');b=Business.objects.get(pk='legacy-business');p=Product.objects.get(pk='legacy-product');profile=AccountProfile.objects.get(user=u)
assert u.check_password('Legacy-verified-987!') and b.owner_id==u.pk
assert b.expires==profile.trial_started_at+timedelta(days=90)
assert b.trialStartedAt==profile.trial_started_at
assert b.slug=='legacy-shop'
assert b.plan_id=='vip' and b.primary=='#654321' and b.theme=='elegant' and b.revision==1
assert str(p.price)=='12345.67' and p.revision==1
assert b.slug=='legacy-shop'
assert b.old_slugs.filter(slug='legacy_shop').exists()
assert Plan.objects.get(pk='pro').price==49000 and Plan.objects.get(pk='vip').price==99000
print(json.dumps({'legacy_account':'preserved','trial_and_subscription':'preserved','product_and_design':'preserved','prices':'49000/99000'}))""",
        ],
    )
    print(result.stdout.strip().splitlines()[-1])
