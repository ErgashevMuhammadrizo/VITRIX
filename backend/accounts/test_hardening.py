import base64, io, json, tempfile
from datetime import timedelta, datetime, timezone as dt_timezone
from unittest.mock import patch
from PIL import Image
from django.test import TestCase, Client, override_settings
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.management import call_command
from .models import (
    Business,
    Product,
    Category,
    Plan,
    Event,
    EmailCode,
    RateBucket,
    DesignVersion,
    ensure_business,
)
from .catalogue import analytics
from .security import allow
from .workspace import image_url

User = get_user_model()


class HardeningTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "shop", "shop@example.com", "Valid-test-password987!"
        )
        self.b = ensure_business(self.user)
        self.client.force_login(self.user)

    def change(self, record, revision=None, entity="businesses"):
        return self.client.patch(
            "/api/v1/workspace/",
            json.dumps(
                {
                    "changes": [
                        {
                            "entity": entity,
                            "op": "upsert",
                            "revision": (
                                self.b.revision if revision is None else revision
                            ),
                            "record": {"id": str(self.b.pk), **record},
                        }
                    ]
                }
            ),
            content_type="application/json",
        )

    def post(self, path, data, client=None, **headers):
        return (client or self.client).post(
            "/api/v1/" + path,
            json.dumps(data),
            content_type="application/json",
            **headers,
        )

    def test_login_limit_survives_new_sessions(self):
        for _ in range(10):
            self.assertEqual(
                self.post(
                    "auth/login/",
                    {"username": "SHOP@EXAMPLE.COM", "password": "bad"},
                    Client(),
                ).status_code,
                401,
            )
        self.assertEqual(
            self.post(
                "auth/login/", {"username": "shop", "password": "bad"}, Client()
            ).status_code,
            429,
        )

    def test_forged_forwarded_ip_does_not_reset_account_limit(self):
        for i in range(10):
            self.post(
                "auth/login/",
                {"username": "shop", "password": "bad"},
                Client(),
                HTTP_X_FORWARDED_FOR=f"8.8.8.{i}",
            )
        self.assertEqual(
            self.post(
                "auth/login/",
                {"username": "shop", "password": "bad"},
                Client(),
                HTTP_X_FORWARDED_FOR="9.9.9.9",
            ).status_code,
            429,
        )

    def test_password_reset_malformed_matrix_is_400(self):
        for value in [None, [], {}, 123, True]:
            with self.subTest(value=value):
                self.assertEqual(
                    self.post(
                        "auth/reset-password/",
                        {"email": self.user.email, "password": value, "code": "123456"},
                    ).status_code,
                    400,
                )

    def test_register_and_profile_reject_unbounded_or_wrong_types(self):
        self.assertEqual(
            self.post(
                "auth/login/", {"username": "shop", "password": "bad", "remember": []}
            ).status_code,
            400,
        )
        self.assertEqual(self.post("auth/register/", {"email": None}).status_code, 400)
        self.assertEqual(
            self.client.patch(
                "/api/v1/auth/profile/",
                json.dumps({"firstName": None}),
                content_type="application/json",
            ).status_code,
            400,
        )

    def test_old_save_conflicts_instead_of_overwriting(self):
        self.assertEqual(self.change({"name": "Window A"}).status_code, 200)
        self.assertEqual(
            self.change({"description": "Window B"}, revision=1).status_code, 409
        )
        self.b.refresh_from_db()
        self.assertEqual(self.b.name, "Window A")
        self.assertEqual(self.b.description, "")

    def test_existing_record_requires_revision(self):
        r = self.client.patch(
            "/api/v1/workspace/",
            json.dumps(
                {
                    "changes": [
                        {
                            "entity": "businesses",
                            "op": "upsert",
                            "record": {"id": str(self.b.pk), "name": "Old client"},
                        }
                    ]
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 409)

    def test_canonical_identity_is_enforced_by_database(self):
        for field, value in [("email", "SHOP@example.com"), ("username", "SHOP")]:
            with self.subTest(field=field), self.assertRaises(
                IntegrityError
            ), transaction.atomic():
                User.objects.create_user(
                    **{
                        "username": "different",
                        "email": "different@example.com",
                        field: value,
                    }
                )

    def test_newest_event_beyond_20000_is_in_aggregates_and_export(self):
        self.b.plan = Plan.objects.get(pk="vip")
        self.b.save()
        now = timezone.now()
        Event.objects.bulk_create(
            [Event(business=self.b, kind="visit", at=now) for _ in range(20000)],
            batch_size=1000,
        )
        Event.objects.create(business=self.b, kind="telegram", at=now)
        data = self.client.get("/api/v1/workspace/").json()
        self.assertEqual(data["events"], [])
        self.assertEqual(
            data["analytics"][str(self.b.pk)]["totals"],
            {"visit": 20000, "phone": 0, "telegram": 1},
        )
        csv = b"".join(
            self.client.get(
                f"/api/v1/businesses/{self.b.pk}/events.csv"
            ).streaming_content
        ).decode()
        self.assertEqual(len(csv.splitlines()), 20002)
        self.assertIn("telegram,", csv)

    def test_analytics_uses_tashkent_calendar_day(self):
        fixed = datetime(2026, 11, 7, 0, 10, tzinfo=dt_timezone.utc)
        Event.objects.create(
            business=self.b,
            kind="visit",
            at=datetime(2026, 11, 6, 21, 0, tzinfo=dt_timezone.utc),
        )
        with patch("django.utils.timezone.now", return_value=fixed):
            result = analytics(self.b, 1)
        self.assertEqual(result["today"], "2026-11-07")
        self.assertEqual(result["totals"]["visit"], 1)

    def test_public_dto_removes_internal_metadata_and_hidden_prices(self):
        Product.objects.create(
            business=self.b, name="Hidden", slug="hidden", price=123, oldPrice=200
        )
        self.b.showPrices = False
        self.b.save()
        data = Client().get(f"/api/v1/public/businesses/{self.b.slug}/").json()
        for key in [
            "ownerId",
            "accountId",
            "planId",
            "expires",
            "trialStartedAt",
            "revision",
            "createdAt",
        ]:
            self.assertNotIn(key, data["business"])
        self.assertNotIn("price", data["products"][0])
        self.assertNotIn("oldPrice", data["products"][0])

    def test_large_catalogues_are_bounded_and_last_page_reachable(self):
        Product.objects.bulk_create(
            [
                Product(
                    business=self.b,
                    name=f"Item {n}",
                    slug=f"item-{n}",
                    price=1,
                    order=n,
                )
                for n in range(125)
            ]
        )
        snapshot = self.client.get("/api/v1/workspace/").json()
        self.assertEqual(len(snapshot["products"]), 50)
        self.assertEqual(snapshot["counts"][str(self.b.pk)]["products"], 125)
        private = self.client.get(
            "/api/v1/collections/products/?page=2&pageSize=100"
        ).json()
        self.assertEqual(len(private["items"]), 25)
        self.assertEqual(private["pagination"]["total"], 125)
        public = Client().get(f"/api/v1/public/businesses/{self.b.slug}/?page=6").json()
        self.assertEqual(len(public["products"]), 5)
        self.assertFalse(public["pagination"]["hasMore"])

    def test_collections_cannot_read_other_tenant(self):
        other = User.objects.create_user("other", "other@example.com")
        b = ensure_business(other)
        Product.objects.create(business=b, name="Private", slug="private", price=1)
        self.assertEqual(
            self.client.get(
                "/api/v1/collections/products/?businessId=" + str(b.pk)
            ).json()["items"],
            [],
        )
        self.assertEqual(
            self.client.get(f"/api/v1/businesses/{b.pk}/analytics/").status_code, 403
        )

    def test_failed_old_email_send_preserves_new_code(self):
        def overlapping(*args, **kwargs):
            EmailCode.objects.filter(email=self.user.email, purpose="reset").update(
                digest="newer-attempt"
            )
            raise OSError("old send failed")

        with patch("accounts.views.send_mail", side_effect=overlapping):
            self.assertEqual(
                self.post(
                    "auth/request-code/", {"email": self.user.email, "purpose": "reset"}
                ).status_code,
                503,
            )
        self.assertEqual(EmailCode.objects.get().digest, "newer-attempt")

    def test_server_saved_design_restore_keeps_business_data(self):
        self.assertEqual(
            self.change({"primary": "#123456", "phone": "998901234567"}).status_code,
            200,
        )
        versions = self.client.get(f"/api/v1/businesses/{self.b.pk}/designs/").json()[
            "versions"
        ]
        self.assertEqual(len(versions), 2)
        self.b.refresh_from_db()
        r = self.post(
            f"businesses/{self.b.pk}/designs/",
            {"versionId": versions[-1]["id"], "revision": self.b.revision},
        )
        self.assertEqual(r.status_code, 200)
        self.b.refresh_from_db()
        self.assertEqual(self.b.primary, "#315bea")
        self.assertEqual(self.b.phone, "998901234567")
        self.assertEqual(self.b.plan_id, "starter")

    def test_restore_other_tenant_version_is_rejected(self):
        other = User.objects.create_user("other")
        version = DesignVersion.objects.create(
            business=ensure_business(other), design={"primary": "#000000"}
        )
        self.assertEqual(
            self.post(
                f"businesses/{self.b.pk}/designs/",
                {"versionId": version.pk, "revision": 1},
            ).status_code,
            404,
        )

    def test_old_business_slug_has_explicit_redirect(self):
        old = self.b.slug
        self.assertEqual(self.change({"slug": "new-shop-slug"}).status_code, 200)
        self.assertEqual(
            Client().get(f"/api/v1/public/businesses/{old}/").json()["redirect"],
            "new-shop-slug",
        )

    def test_public_product_link_only_reads_published_product(self):
        Product.objects.create(business=self.b, name="Visible", slug="visible", price=1)
        Product.objects.create(
            business=self.b, name="Draft", slug="draft", price=1, status="draft"
        )
        self.assertEqual(
            len(
                Client()
                .get(f"/api/v1/public/businesses/{self.b.slug}/?product=visible")
                .json()["products"]
            ),
            1,
        )
        self.assertEqual(
            Client()
            .get(f"/api/v1/public/businesses/{self.b.slug}/?product=draft")
            .json()["products"],
            [],
        )

    def test_event_rate_limit_survives_session_reset(self):
        with patch("accounts.workspace.allow", return_value=False):
            self.assertEqual(
                self.post(
                    f"public/businesses/{self.b.slug}/events/",
                    {"kind": "visit"},
                    Client(),
                ).status_code,
                429,
            )
        self.assertEqual(Event.objects.count(), 0)

    def test_rate_limit_is_database_backed(self):
        self.assertTrue(allow("test", "account", 1, 60))
        self.assertFalse(allow("test", "account", 1, 60))
        self.assertEqual(RateBucket.objects.count(), 1)

    def test_images_are_reencoded_without_metadata(self):
        image = Image.new("RGB", (2000, 1000), "red")
        exif = Image.Exif()
        exif[0x010E] = "private metadata"
        data = io.BytesIO()
        image.save(data, format="JPEG", exif=exif)
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            path = image_url(
                "data:image/jpeg;base64," + base64.b64encode(data.getvalue()).decode()
            )
            result = Image.open(directory + "/" + path.removeprefix("/media/"))
            self.assertLessEqual(result.width, 1600)
            self.assertFalse(result.getexif())
            self.assertEqual(result.format, "WEBP")

    def test_failed_batch_cleans_staged_files_and_database(self):
        image = Image.new("RGB", (10, 10), "red")
        data = io.BytesIO()
        image.save(data, format="PNG")
        from pathlib import Path

        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            value = (
                "data:image/png;base64," + base64.b64encode(data.getvalue()).decode()
            )
            body = {
                "changes": [
                    {
                        "entity": "businesses",
                        "op": "upsert",
                        "revision": 1,
                        "record": {"id": str(self.b.pk), "logo": value},
                    },
                    {"entity": "invalid", "op": "upsert", "record": {"id": "bad"}},
                ]
            }
            self.assertEqual(
                self.client.patch(
                    "/api/v1/workspace/",
                    json.dumps(body),
                    content_type="application/json",
                ).status_code,
                400,
            )
            self.assertEqual([p for p in Path(directory).rglob("*") if p.is_file()], [])
            self.b.refresh_from_db()
            self.assertEqual(self.b.logo, "")

    def test_request_id_and_private_cache_headers(self):
        r = self.client.get("/api/v1/workspace/")
        self.assertEqual(len(r["X-Request-ID"]), 32)
        self.assertEqual(r["Cache-Control"], "no-store")

    def test_public_expired_business_is_not_exposed(self):
        self.b.expires = timezone.now() - timedelta(seconds=1)
        self.b.save()
        self.assertEqual(
            Client().get(f"/api/v1/public/businesses/{self.b.slug}/").status_code, 410
        )

    def test_django_admin_uses_the_same_login_limiter(self):
        for _ in range(10):
            self.assertTrue(allow("login", str(self.user.pk), 10, 600))
        result = Client().post(
            "/django-admin/login/",
            {"username": self.user.username, "password": "wrong"},
        )
        self.assertEqual(result.status_code, 429)

    def test_summary_does_not_fetch_catalog_records(self):
        result = self.client.get("/api/v1/workspace/?view=summary").json()
        self.assertIn("counts", result)
        for key in ["products", "categories", "users", "businesses"]:
            self.assertNotIn(key, result)

    def test_huge_pagination_cannot_overflow_database_offset(self):
        self.assertEqual(
            self.client.get(
                "/api/v1/collections/products/?page=" + "9" * 30
            ).status_code,
            400,
        )

    def test_generated_slug_with_username_underscore_can_be_saved(self):
        user = User.objects.create_user(
            "under__score", "under@example.test", first_name="A" * 150
        )
        business = ensure_business(user)
        self.assertNotIn("_", business.slug)
        business.full_clean()
        self.assertEqual(str(ensure_business(user).pk), str(business.pk))
