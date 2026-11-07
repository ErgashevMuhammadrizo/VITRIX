import base64, io, json, tempfile
from datetime import timedelta
from PIL import Image
from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Business,
    Product,
    Category,
    Plan,
    Event,
    SubscriptionRequest,
    ensure_business,
)

User = get_user_model()


class WorkspaceTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user("owner_one", email="one@example.com")
        self.other = User.objects.create_user("owner_two", email="two@example.com")
        self.admin = User.objects.create_superuser(
            "platform_owner", "platform@example.com", "Test-password987!"
        )
        self.b = ensure_business(self.owner)
        self.other_b = ensure_business(self.other)
        self.client.force_login(self.owner)

    def change(self, entity, record=None, op="upsert", key=None):
        model = {
            "products": Product,
            "categories": Category,
            "businesses": Business,
            "plans": Plan,
        }.get(entity)
        obj = (
            model.objects.filter(pk=(record or {}).get("id") or key).first()
            if model
            else None
        )
        revision = obj.revision if obj else None
        return self.client.patch(
            "/api/v1/workspace/",
            json.dumps(
                {
                    "changes": [
                        {
                            "entity": entity,
                            "op": op,
                            "record": record or {},
                            "id": key,
                            "revision": revision,
                        }
                    ]
                }
            ),
            content_type="application/json",
        )

    def product(self, pk="new", business=None, **patches):
        v = {
            "id": pk,
            "businessId": str((business or self.b).pk),
            "name": "Mahsulot",
            "slug": pk,
            "categoryId": "",
            "image": "",
            "images": [],
            "price": 10000,
            "oldPrice": 0,
            "description": "Tavsif",
            "shortDescription": "Qisqa tavsif",
            "availability": "available",
            "featured": False,
            "order": 0,
            "status": "published",
        }
        v.update(patches)
        return v

    def test_auth_required_for_workspace(self):
        self.client.logout()
        self.assertEqual(self.client.get("/api/v1/workspace/").status_code, 401)

    def test_owner_snapshot_is_tenant_scoped(self):
        r = self.client.get("/api/v1/workspace/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(
            [b["ownerId"] for b in r.json()["businesses"]], [str(self.owner.pk)]
        )

    def test_products_persist_and_public_reads_without_login(self):
        self.assertEqual(self.change("products", self.product()).status_code, 200)
        self.client.logout()
        r = self.client.get(f"/api/v1/public/businesses/{self.b.slug}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["products"][0]["name"], "Mahsulot")

    def test_cannot_write_other_tenant(self):
        self.assertEqual(
            self.change("products", self.product(business=self.other_b)).status_code,
            403,
        )
        self.assertEqual(Product.objects.count(), 0)

    def test_cannot_move_or_delete_other_tenant_record(self):
        p = Product.objects.create(
            id="foreign", business=self.other_b, name="Foreign", slug="foreign", price=1
        )
        self.assertEqual(
            self.change("products", self.product("foreign")).status_code, 403
        )
        self.assertEqual(
            self.change("products", op="delete", key=p.pk).status_code, 403
        )

    def test_category_must_belong_to_business(self):
        category = Category.objects.create(business=self.other_b, name="Foreign")
        r = self.change("products", self.product(categoryId=str(category.pk)))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Product.objects.count(), 0)

    def test_trial_limit_is_enforced_by_server(self):
        Product.objects.bulk_create(
            [
                Product(
                    id=str(i),
                    business=self.b,
                    name="Item",
                    slug="item-" + str(i),
                    price=1,
                )
                for i in range(1000)
            ]
        )
        self.assertEqual(
            self.change("products", self.product("one-more")).status_code, 400
        )
        self.b.plan = Plan.objects.get(pk="pro")
        self.b.save()
        self.assertEqual(
            self.change("products", self.product("one-more")).status_code, 200
        )

    def test_owner_cannot_grant_vip_or_extend_expiry(self):
        r = self.change("businesses", {"id": str(self.b.pk), "planId": "vip"})
        self.assertEqual(r.status_code, 403)
        self.b.refresh_from_db()
        self.assertEqual(self.b.plan_id, "starter")

    def test_expired_subscription_blocks_write_and_public_catalog(self):
        self.b.expires = timezone.now() - timedelta(seconds=1)
        self.b.save()
        self.assertEqual(self.change("products", self.product()).status_code, 403)
        self.assertEqual(
            self.client.get(f"/api/v1/public/businesses/{self.b.slug}/").status_code,
            410,
        )

    def test_unpublished_and_inactive_category_products_are_hidden(self):
        self.change("products", self.product("draft", status="draft"))
        c = Category.objects.create(business=self.b, name="Hidden", active=False)
        self.change("products", self.product("hidden", categoryId=str(c.pk)))
        r = self.client.get(f"/api/v1/public/businesses/{self.b.slug}/")
        self.assertEqual(r.json()["products"], [])

    def test_slug_reserved_and_unknown_slug_404(self):
        self.assertEqual(
            self.change(
                "businesses", {"id": str(self.b.pk), "slug": "admin"}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get("/api/v1/public/businesses/does-not-exist/").status_code,
            404,
        )

    def test_category_deletion_keeps_product(self):
        self.change(
            "categories",
            {
                "id": "cat",
                "businessId": str(self.b.pk),
                "name": "Category",
                "order": 0,
                "active": True,
                "image": "",
                "description": "",
            },
        )
        self.change("products", self.product(categoryId="cat"))
        self.assertEqual(
            self.change("categories", op="delete", key="cat").status_code, 200
        )
        self.assertIsNone(Product.objects.get().category_id)

    def test_failed_batch_rolls_back_all_changes(self):
        changes = [
            {"entity": "products", "op": "upsert", "record": self.product()},
            {
                "entity": "products",
                "op": "upsert",
                "record": self.product("foreign", business=self.other_b),
            },
        ]
        r = self.client.patch(
            "/api/v1/workspace/",
            json.dumps({"changes": changes}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 403)
        self.assertEqual(Product.objects.count(), 0)

    def test_real_image_is_persisted(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            stream = io.BytesIO()
            Image.new("RGB", (3, 3), "blue").save(stream, format="PNG")
            image = (
                "data:image/png;base64," + base64.b64encode(stream.getvalue()).decode()
            )
            r = self.change("products", self.product(image=image))
            self.assertEqual(r.status_code, 200)
            self.assertTrue(Product.objects.get().image.startswith("/media/uploads/"))

    def test_invalid_image_is_rejected(self):
        self.assertEqual(
            self.change(
                "products", self.product(image="data:image/png;base64,bm90LWFuLWltYWdl")
            ).status_code,
            400,
        )

    def test_subscription_requires_admin_approval_and_cannot_replay(self):
        r = self.client.post(
            "/api/v1/subscriptions/request/",
            json.dumps({"planId": "vip"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 201)
        req = SubscriptionRequest.objects.get()
        self.b.refresh_from_db()
        self.assertEqual(self.b.plan_id, "starter")
        endpoint = f"/api/v1/admin/subscriptions/{req.pk}/review/"
        self.assertEqual(
            self.client.post(
                endpoint, json.dumps({"approve": True}), content_type="application/json"
            ).status_code,
            403,
        )
        self.client.force_login(self.admin)
        self.assertEqual(
            self.client.post(
                endpoint, json.dumps({"approve": True}), content_type="application/json"
            ).status_code,
            200,
        )
        self.b.refresh_from_db()
        self.assertEqual(self.b.plan_id, "vip")
        self.assertEqual(
            self.client.post(
                endpoint, json.dumps({"approve": True}), content_type="application/json"
            ).status_code,
            400,
        )

    def test_pro_and_vip_analytics_ranges(self):
        Event.objects.create(
            business=self.b, kind="visit", at=timezone.now() - timedelta(days=30)
        )
        self.assertEqual(self.client.get("/api/v1/workspace/").json()["events"], [])
        self.b.plan = Plan.objects.get(pk="vip")
        self.b.save()
        self.assertEqual(
            self.client.get("/api/v1/workspace/").json()["analytics"][str(self.b.pk)][
                "totals"
            ]["visit"],
            1,
        )

    def test_owner_cannot_edit_platform_or_plans(self):
        self.assertEqual(
            self.change("plans", {"id": "pro", "price": 0}).status_code, 403
        )
        self.assertEqual(
            self.change("platform", {"id": "1", "name": "Changed"}).status_code, 403
        )
