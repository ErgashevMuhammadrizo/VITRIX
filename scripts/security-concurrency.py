"""Run with the project's Python environment. Isolated file-backed SQLite only."""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))

def setup():
    os.environ['DJANGO_SETTINGS_MODULE']='config.settings'
    import django
    django.setup()

if len(sys.argv)>1:
    setup()
    if sys.argv[1]=='limit':
        from accounts.security import allow
        print(int(allow('concurrency','same-client',3,600)))
    else:
        from django.test import Client
        from django.contrib.auth import get_user_model
        client=Client();client.force_login(get_user_model().objects.get(username='parallel'))
        record=json.loads(sys.argv[2])
        response=client.patch('/api/v1/workspace/',json.dumps({'changes':[{'entity':'businesses','op':'upsert','record':record}]}),content_type='application/json')
        print(response.status_code)
    sys.exit(0)

with tempfile.TemporaryDirectory(prefix='vitrix-concurrency-') as directory:
    os.environ.update(DJANGO_DEBUG='1',DATABASE_PATH=str(Path(directory)/'check.sqlite3'))
    setup()
    from django.core.management import call_command
    from django.contrib.auth import get_user_model
    from accounts.models import ensure_business
    from accounts.security import revision
    call_command('migrate',verbosity=0)
    business=ensure_business(get_user_model().objects.create_user('parallel'))
    record={'id':str(business.pk),'revision':revision(business),'name':'Concurrent edit'}
    def run(args):
        result=subprocess.run([sys.executable,__file__,*args],capture_output=True,text=True,check=True)
        return int(result.stdout.strip().splitlines()[-1])
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        limits=list(pool.map(run,[['limit']]*8))
        statuses=list(pool.map(run,[['write',json.dumps(record)]]*2))
    assert sum(limits)==3,limits
    assert sorted(statuses)==[200,409],statuses
    print('PASS: 8 independent processes share a 3-attempt limit; concurrent stale saves return 200 and 409.')
