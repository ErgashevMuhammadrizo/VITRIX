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
        self.assertIn("20 000", text)
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
