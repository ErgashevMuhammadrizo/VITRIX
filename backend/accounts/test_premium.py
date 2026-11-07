import json, uuid
from datetime import timedelta
from urllib.parse import urlparse, parse_qs
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Business,
    Plan,
    PlatformSettings,
    SubscriptionActivation,
    SubscriptionRequest,
    ensure_business,
)

User = get_user_model()


@override_settings(SUBSCRIPTION_TELEGRAM="", FRONTEND_URL="https://vitrix.example")
class PremiumTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="shopowner",
            email="owner@example.com",
            password="SecureExample123!",
        )
        self.other = User.objects.create_user(
            username="otherowner", password="SecureExample123!"
        )
        self.admin = User.objects.create_superuser(
            username="siteadmin",
            email="admin@example.com",
            password="SecureExample123!",
        )
        self.b = ensure_business(self.owner)
        self.other_b = ensure_business(self.other)
        self.client.force_login(self.owner)

    def post(self, path, data):
        return self.client.post(
            "/api/v1/" + path, json.dumps(data), content_type="application/json"
        )

    def change(self, data):
        from .security import revision
        current = Business.objects.get(pk=self.b.pk)
        data = {"revision": revision(current), **data}
        return self.client.patch(
            "/api/v1/workspace/",
            json.dumps(
                {
                    "changes": [
                        {
                            "entity": "businesses",
                            "op": "upsert",
                            "record": {"id": str(self.b.pk), **data},
                        }
                    ]
                }
            ),
            content_type="application/json",
        )

    def activation(self, **kwargs):
        data = {
            "planId": "pro",
            "months": 1,
            "mode": "extend",
            "note": "Payment checked",
            "idempotencyKey": str(uuid.uuid4()),
        }
        data.update(kwargs)
        return data

    def test_id_stable_and_not_spoofable(self):
        r = self.client.get("/api/v1/auth/me/").json()["user"]
        self.assertEqual(r["accountId"], f"VX-{self.owner.pk:06d}")
        self.assertEqual(self.change({"accountId": "VX-999999"}).status_code, 200)
        self.assertEqual(
            self.client.get("/api/v1/workspace/").json()["businesses"][0]["accountId"],
            r["accountId"],
        )

    def test_telegram_draft_has_trusted_identity(self):
        PlatformSettings.objects.update_or_create(
            pk=1, defaults={"subscriptionTelegram": "myoperator"}
        )
        r = self.post(
            "subscriptions/telegram/", {"planId": "pro", "accountId": "spoof"}
        )
        self.assertEqual(r.status_code, 200)
        u = urlparse(r.json()["url"])
        self.assertEqual(u.netloc, "t.me")
        self.assertEqual(u.path, "/myoperator")
        text = parse_qs(u.query)["text"][0]
        self.assertIn(f"VX-{self.owner.pk:06d}", text)
        self.assertIn(self.b.name, text)
        self.assertIn("https://vitrix.example/" + self.b.slug, text)
        self.assertIn("49 000", text)
        self.assertNotIn("spoof", text)
        self.assertEqual(SubscriptionActivation.objects.count(), 0)

    def test_operator_unset_no_fake_request(self):
        self.assertEqual(
            self.post("subscriptions/telegram/", {"planId": "pro"}).status_code, 503
        )
        self.assertEqual(SubscriptionRequest.objects.count(), 0)

    @override_settings(SUBSCRIPTION_TELEGRAM="envoperator")
    def test_env_operator_fallback_and_repeat(self):
        self.assertEqual(
            self.client.get("/api/v1/public/config/").json()["platform"][
                "subscriptionTelegram"
            ],
            "envoperator",
        )
        self.assertEqual(
            self.post("subscriptions/telegram/", {"planId": "pro"}).status_code, 200
        )
        self.assertEqual(
            self.post("subscriptions/telegram/", {"planId": "vip"}).status_code, 200
        )
        self.assertEqual(SubscriptionRequest.objects.count(), 1)
        self.assertEqual(SubscriptionRequest.objects.get().plan_id, "vip")

    def test_only_admin_can_activate(self):
        self.assertEqual(
            self.post(
                f"admin/businesses/{self.b.pk}/subscription/", self.activation()
            ).status_code,
            403,
        )

    def test_admin_activation_month_and_retry(self):
        self.client.force_login(self.admin)
        old = self.b.expires
        data = self.activation()
        path = f"admin/businesses/{self.b.pk}/subscription/"
        self.assertEqual(self.post(path, data).status_code, 200)
        self.b.refresh_from_db()
        self.assertEqual(self.b.expires, old + timedelta(days=30))
        self.assertEqual(self.b.plan_id, "pro")
        self.assertEqual(self.post(path, data).status_code, 200)
        self.b.refresh_from_db()
        self.assertEqual(self.b.expires, old + timedelta(days=30))
        self.assertEqual(SubscriptionActivation.objects.count(), 1)
        self.assertEqual(SubscriptionActivation.objects.get().actor, self.admin)
        self.assertEqual(self.post(path, {**data, "months": 3}).status_code, 409)

    def test_expired_activation_and_pending_approval(self):
        self.b.expires = timezone.now() - timedelta(days=2)
        self.b.save()
        SubscriptionRequest.objects.create(business=self.b, plan_id="vip")
        self.client.force_login(self.admin)
        now = timezone.now()
        r = self.post(
            f"admin/businesses/{self.b.pk}/subscription/", self.activation(planId="vip")
        )
        self.assertEqual(r.status_code, 200)
        self.b.refresh_from_db()
        self.assertLess(abs((self.b.expires - now).total_seconds() - 30 * 86400), 5)
        self.assertEqual(SubscriptionRequest.objects.get().status, "approved")

    def test_invalid_activation_no_change(self):
        self.client.force_login(self.admin)
        for patch in [
            {"months": True},
            {"months": 0},
            {"months": 2},
            {"months": 13},
            {"idempotencyKey": "bad"},
            {"planId": "starter"},
            {"mode": "other"},
        ]:
            self.assertEqual(
                self.post(
                    f"admin/businesses/{self.b.pk}/subscription/",
                    self.activation(**patch),
                ).status_code,
                400,
            )
        self.assertEqual(SubscriptionActivation.objects.count(), 0)

    def test_generic_admin_save_cannot_bypass_activation(self):
        self.client.force_login(self.admin)
        self.assertEqual(self.change({"planId": "vip"}).status_code, 400)

    def test_design_persists_public(self):
        data = {
            "colorMode": "dark",
            "backgroundColor": "#101726",
            "surfaceColor": "#182233",
            "textColor": "#ffffff",
            "surfaceTextColor": "#ffffff",
            "mutedColor": "#aabbcc",
            "heroTitle": "My shop",
            "heroStyle": "minimal",
            "contentWidth": "full",
            "productColumns": 4,
            "mobileColumns": 1,
            "showSearch": False,
            "showPrices": False,
            "cornerStyle": "round",
            "font": "rounded",
        }
        self.assertEqual(self.change(data).status_code, 200)
        b = self.client.get("/api/v1/public/businesses/" + self.b.slug + "/").json()[
            "business"
        ]
        for key, value in data.items():
            self.assertEqual(b[key], value)

    def test_invalid_design_rejected(self):
        for data in [
            {"colorMode": "hacked"},
            {"backgroundColor": "url(x)"},
            {"productColumns": 8},
            {"mobileColumns": 3},
            {"showPrices": "false"},
            {"heroStyle": "bad"},
        ]:
            self.assertEqual(self.change(data).status_code, 400)

    def test_location_text_and_pin_persist(self):
        r = self.change(
            {
                "address": "Toshkent, Chilonzor",
                "latitude": 41.311081,
                "longitude": 69.240562,
                "mapUrl": "https://www.google.com/maps?q=41.311081,69.240562",
            }
        )
        self.assertEqual(r.status_code, 200, r.content)
        b = self.client.get("/api/v1/public/businesses/" + self.b.slug + "/").json()[
            "business"
        ]
        self.assertEqual(b["address"], "Toshkent, Chilonzor")
        self.assertAlmostEqual(b["latitude"], 41.311081)

    def test_invalid_location_rejected(self):
        for data in [
            {"latitude": "bad", "longitude": 10},
            {"latitude": 91, "longitude": 10},
            {"latitude": 10, "longitude": 181},
            {"latitude": 10},
            {"mapUrl": "https://google.com.evil.example/test"},
            {"mapUrl": "javascript:alert(1)"},
            {"mapUrl": "http://maps.google.com/test"},
        ]:
            self.assertEqual(self.change(data).status_code, 400)

    def test_tenant_cannot_change_other_design(self):
        r = self.client.patch(
            "/api/v1/workspace/",
            json.dumps(
                {
                    "changes": [
                        {
                            "entity": "businesses",
                            "op": "upsert",
                            "record": {"id": str(self.other_b.pk), "colorMode": "dark"},
                        }
                    ]
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 403)

    def test_health(self):
        self.assertEqual(self.client.get("/api/v1/health/").status_code, 200)

    def test_new_plan_prices_and_guest_price_access(self):
        self.assertEqual(Plan.objects.get(pk='pro').price,49000)
        self.assertEqual(Plan.objects.get(pk='vip').price,99000)
        self.client.logout()
        self.assertEqual(self.client.get('/api/v1/plans/').status_code,401)
        self.assertEqual(self.client.get('/api/v1/public/config/').json()['plans'],[])
        self.client.force_login(self.owner)
        plans=self.client.get('/api/v1/plans/').json()['plans']
        self.assertEqual(next(p for p in plans if p['id']=='pro')['price'],49000)

    def test_content_translations_saved_and_returned_publicly(self):
        translations={'uz':{'name':'Asosiy'},'ru':{'name':'Магазин','description':'Описание'},'en':{'name':'Shop','description':'Description'}}
        self.assertEqual(self.change({'translations':translations}).status_code,200)
        data=self.client.get('/api/v1/public/businesses/'+self.b.slug+'/').json()
        self.assertEqual(data['business']['translations'],translations)

    def test_content_translations_validation(self):
        for value in [[],{'fr':{'name':'Test'}},{'ru':{'ownerId':'100'}},{'en':{'name':100}},{'ru':{'name':'x'*101}}]:
            self.assertEqual(self.change({'translations':value}).status_code,400)

    def test_api_error_language(self):
        self.client.logout()
        r=self.client.get('/api/v1/workspace/',HTTP_ACCEPT_LANGUAGE='ru')
        self.assertEqual(r.status_code,401)
        self.assertEqual(r.json()['detail'],'Войдите в аккаунт.')
        r=self.client.get('/api/v1/workspace/',HTTP_ACCEPT_LANGUAGE='en')
        self.assertEqual(r.json()['detail'],'Log in to your account.')

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_verification_email_follows_language(self):
        from django.core import mail
        self.client.logout()
        r=self.client.post('/api/v1/auth/request-code/',json.dumps({'email':'english@example.com'}),content_type='application/json',HTTP_ACCEPT_LANGUAGE='en')
        self.assertEqual(r.status_code,200)
        self.assertIn('verification code',mail.outbox[-1].subject)
        self.assertIn('Do not share it.',mail.outbox[-1].body)
        self.assertIn('DEALS',mail.outbox[-1].body)

    def test_telegram_draft_language_and_new_price(self):
        PlatformSettings.objects.update_or_create(pk=1,defaults={'subscriptionTelegram':'myoperator'})
        r=self.client.post('/api/v1/subscriptions/telegram/',json.dumps({'planId':'vip'}),content_type='application/json',HTTP_ACCEPT_LANGUAGE='en')
        self.assertEqual(r.status_code,200)
        text=parse_qs(urlparse(r.json()['url']).query)['text'][0]
        self.assertIn('Hello!',text)
        self.assertIn('99 000 UZS',text)
        self.assertIn(f'VX-{self.owner.pk:06d}',text)
