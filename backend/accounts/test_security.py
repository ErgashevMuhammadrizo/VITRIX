import base64, io, json, tempfile
from datetime import timedelta
from unittest.mock import patch
from PIL import Image
from django.contrib.auth import get_user_model
from django.test import Client, TestCase, RequestFactory, override_settings
from django.utils import timezone
from .models import Product, Event, SecurityBucket, ensure_business
from .security import allow, client_address, revision
from .workspace import image_url
User = get_user_model()

class SecurityTests(TestCase):
    def setUp(self):
        self.user=User.objects.create_user('safeowner','safe@example.com','Secure-pass123!')
        self.business=ensure_business(self.user)
    def post(self,path,data,client=None):
        return (client or self.client).post('/api/v1/'+path,json.dumps(data),content_type='application/json')
    def change(self,changes):
        return self.client.patch('/api/v1/workspace/',json.dumps({'changes':changes}),content_type='application/json')

    def test_login_limit_survives_new_sessions_and_aliases(self):
        for i in range(10):
            identifier='SAFEOWNER' if i%2 else 'safe@example.com'
            self.assertEqual(self.post('auth/login/',{'username':identifier,'password':'wrong'},Client()).status_code,401)
        self.assertEqual(self.post('auth/login/',{'username':'safeowner','password':'Secure-pass123!'},Client()).status_code,429)
        SecurityBucket.objects.update(expires_at=timezone.now()-timedelta(seconds=1))
        self.assertEqual(self.post('auth/login/',{'username':'safeowner','password':'Secure-pass123!'},Client()).status_code,200)

    def test_ip_limit_covers_rotating_usernames(self):
        with patch('accounts.views.authenticate',return_value=None):
            for i in range(60):
                self.assertEqual(self.post('auth/login/',{'username':f'unknown{i}','password':'wrong'},Client()).status_code,401)
        self.assertEqual(self.post('auth/login/',{'username':'new','password':'wrong'},Client()).status_code,429)

    def test_reset_bad_types_return_400(self):
        for value in [None,[],{},True,100]:
            self.assertEqual(self.post('auth/reset-password/',{'email':'safe@example.com','code':'123456','password':value}).status_code,400)
        self.assertTrue(User.objects.get(pk=self.user.pk).check_password('Secure-pass123!'))

    def test_long_password_rejected(self):
        self.assertEqual(self.post('auth/login/',{'username':'safeowner','password':'a'*1025}).status_code,400)

    def test_limits_store_hashed_identifiers(self):
        allow('email','private@example.com',1,60)
        key=SecurityBucket.objects.get().key
        self.assertNotIn('private',key);self.assertEqual(len(key),40)

    @override_settings(INTERNAL_PROXY_TOKEN='a'*48)
    def test_forwarded_ip_requires_internal_token(self):
        r=RequestFactory().get('/',REMOTE_ADDR='127.0.0.1',HTTP_X_FORWARDED_FOR='6.6.6.6',HTTP_X_VITRIX_CLIENT_IP='1.2.3.4')
        self.assertEqual(client_address(r),'127.0.0.1')
        r=RequestFactory().get('/',REMOTE_ADDR='127.0.0.1',HTTP_X_VITRIX_CLIENT_IP='1.2.3.4',HTTP_X_VITRIX_PROXY_TOKEN='a'*48)
        self.assertEqual(client_address(r),'1.2.3.4')

    def test_stale_workspace_update_and_missing_revision_rejected(self):
        self.client.force_login(self.user)
        change={'entity':'businesses','op':'upsert','record':{'id':str(self.business.pk),'revision':revision(self.business),'name':'First'}}
        self.assertEqual(self.change([change]).status_code,200)
        change['record']['name']='Second'
        self.assertEqual(self.change([change]).status_code,409)
        del change['record']['revision']
        self.assertEqual(self.change([change]).status_code,409)
        self.business.refresh_from_db();self.assertEqual(self.business.name,'First')

    def test_stale_delete_rejected(self):
        self.client.force_login(self.user)
        p=Product.objects.create(business=self.business,name='Old',slug='item',price=1)
        token=revision(p);p.name='Changed';p.save()
        self.assertEqual(self.change([{'entity':'products','op':'delete','id':str(p.pk),'revision':token}]).status_code,409)
        self.assertTrue(Product.objects.filter(pk=p.pk).exists())

    def test_conflict_rolls_back_entire_batch(self):
        self.client.force_login(self.user)
        p=Product.objects.create(business=self.business,name='Old',slug='item',price=1)
        good={'entity':'products','op':'upsert','record':{'id':str(p.pk),'revision':revision(p),'name':'New'}}
        bad={'entity':'businesses','op':'upsert','record':{'id':str(self.business.pk),'revision':'stale','name':'Wrong'}}
        self.assertEqual(self.change([good,bad]).status_code,409)
        p.refresh_from_db();self.assertEqual(p.name,'Old')

    def test_new_key_collision_cannot_overwrite(self):
        self.client.force_login(self.user)
        p=Product.objects.create(business=self.business,name='Old',slug='item',price=1)
        self.assertEqual(self.change([{'entity':'products','op':'upsert','record':{'id':str(p.pk),'businessId':str(self.business.pk),'name':'Hijack'}}]).status_code,409)

    def test_analytics_includes_events_after_twenty_thousand(self):
        self.client.force_login(self.user)
        Event.objects.bulk_create([Event(business=self.business,kind='visit') for _ in range(20001)],batch_size=500)
        Event.objects.create(business=self.business,kind='telegram')
        response=self.client.get('/api/v1/workspace/');self.assertEqual(response.status_code,200)
        events=response.json()['events']
        self.assertEqual(sum(e['count'] for e in events if e['kind']=='visit'),20001)
        self.assertEqual(sum(e['count'] for e in events if e['kind']=='telegram'),1)
        self.assertLess(len(events),10)

    def test_event_deduplication_survives_new_session(self):
        path=f'public/businesses/{self.business.slug}/events/'
        for _ in range(5):self.assertEqual(self.post(path,{'kind':'visit'},Client()).status_code,200)
        self.assertEqual(Event.objects.count(),1)

    def test_public_data_hides_account_and_subscription(self):
        data=self.client.get(f'/api/v1/public/businesses/{self.business.slug}/').json()['business']
        for key in ['ownerId','accountId','expires','trialStartedAt','revision','planId']:self.assertNotIn(key,data)

    def test_public_pagination_search_and_bad_offset(self):
        Product.objects.bulk_create([Product(id=f'item-{i:03}',business=self.business,name=f'Item {i}',slug=f'item-{i}',price=1) for i in range(205)])
        url=f'/api/v1/public/businesses/{self.business.slug}/'
        pages=[self.client.get(url+f'?offset={offset}').json() for offset in [0,100,200]]
        self.assertEqual([len(v['products']) for v in pages],[100,100,5]);self.assertIsNone(pages[-1]['pageInfo']['nextOffset'])
        self.assertEqual(self.client.get(url+'?q=Item%20204').json()['products'][0]['name'],'Item 204')
        self.assertEqual(self.client.get(url+'?offset=-1').status_code,400)

    def test_workspace_pages_remain_scoped(self):
        self.client.force_login(self.user)
        Product.objects.bulk_create([Product(id=f'item-{i:03}',business=self.business,name=f'Item {i}',slug=f'item-{i}',price=1) for i in range(205)])
        first=self.client.get('/api/v1/workspace/').json();second=self.client.get('/api/v1/workspace/?offset=200').json()
        self.assertEqual(len(first['products']),200);self.assertEqual(len(second['products']),5)
        self.assertEqual({v['businessId'] for v in second['products']},{str(self.business.pk)})

    @override_settings(DATA_UPLOAD_MAX_MEMORY_SIZE=100)
    def test_request_size_limit(self):
        self.assertEqual(self.post('auth/login/',{'username':'x'*200,'password':'a'}).status_code,413)

    def test_non_json_rejected(self):
        self.assertEqual(self.client.post('/api/v1/auth/login/',data='x',content_type='text/plain').status_code,415)

    def test_csrf_required(self):
        self.assertEqual(self.post('auth/login/',{'username':'safeowner','password':'Secure-pass123!'},Client(enforce_csrf_checks=True)).status_code,403)

    def test_profile_types_and_lengths(self):
        self.client.force_login(self.user)
        for data in [{'firstName':{}},{'lastName':'x'*151},{'phone':None}]:
            self.assertEqual(self.client.patch('/api/v1/auth/profile/',json.dumps(data),content_type='application/json').status_code,400)

    def test_api_no_store_and_nosniff(self):
        response=self.client.get('/api/v1/auth/csrf/')
        self.assertEqual(response['Cache-Control'],'no-store');self.assertEqual(response['X-Content-Type-Options'],'nosniff')

    def test_media_refuses_arbitrary_files(self):
        for name in ['db.sqlite3','uploads/test.html','../config/settings.py']:self.assertEqual(self.client.get('/media/'+name).status_code,404)

    def test_image_reencoded_without_appended_payload(self):
        with tempfile.TemporaryDirectory() as directory,override_settings(MEDIA_ROOT=directory):
            stream=io.BytesIO();Image.new('RGB',(2,2)).save(stream,format='PNG')
            url=image_url('data:image/png;base64,'+base64.b64encode(stream.getvalue()+b'<script>dangerous()</script>').decode())
            from django.core.files.storage import default_storage
            with default_storage.open(url.removeprefix('/media/'),'rb') as image:self.assertNotIn(b'<script>',image.read())
